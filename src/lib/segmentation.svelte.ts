import {
  SamModel,
  AutoProcessor,
  RawImage,
  Tensor,
  SamProcessor,
} from "@huggingface/transformers"
import type { ImageFeatureExtractorResult } from "@huggingface/transformers"


//TODO: get the functions from here and make this into a class https://huggingface.co/spaces/webml-community/segment-anything-webgpu/blob/main/index.js
// notes: 
// draggables canvas should add a button that goes into segment mode
// when in segment mode you can't drag anything, focused on just the selected image
// segment mode creates a canvas on top of the selected image of the same dimensions
// when mousing over it shows segments
// when clicking it adds changes buttons in the draggable title menu
//  - cancel segment mode
//  - reset points
//  - cut mask: creates a new draggable image with only the mask
export type ImageEmbeddings = {
  image_embeddings: Tensor;
  image_positional_embeddings: Tensor;
};


export class Segmentation {
  processor?: SamProcessor;
  model?: SamModel;
  imageProcessed?: ImageFeatureExtractorResult;
  imageEmbeddings?: ImageEmbeddings;
  imageInput?: RawImage;
  samModelId: string;
  isDecoding: boolean = false;
  isEncoding: boolean = $state(false);
  isMultiMaskMode: boolean = $state(false);
  decodePending: boolean = false;
  maskCanvas?: HTMLCanvasElement = $state();
  maskContext = $derived(this.maskCanvas?.getContext("2d"))
  lastPoints: Point[] = [];

  constructor(samModelId: string = 'Xenova/slimsam-77-uniform') {
    this.samModelId = samModelId
  }

  reset_mask() {
    this.lastPoints = [];
    this.isMultiMaskMode = false;
  }

  async setup_sam_model() {
    this.processor = await AutoProcessor.from_pretrained(this.samModelId) as SamProcessor;
    //TODO: what to do if webgpu is not available
    this.model = (await SamModel.from_pretrained(this.samModelId, {
      dtype: 'fp16',
      device: 'webgpu'
    })) as SamModel;
  }

  async encode(image_url: string) {
    if (!this.processor || !this.model || this.isEncoding) return;
    this.isEncoding = true;
    this.imageInput = await RawImage.fromURL(image_url);
    this.imageProcessed = await this.processor(this.imageInput);
    if (this.imageProcessed)
      this.imageEmbeddings = await this.model.get_image_embeddings(this.imageProcessed);
    this.isEncoding = false;
  }

  async decode() {
    // Prepare inputs for decoding
    if (!this.processor || !this.model || !this.imageProcessed || !this.imageEmbeddings || this.isEncoding) return;

    if (this.isDecoding) {
      this.decodePending = true;
      return;
    }
    this.isDecoding = true;

    const reshaped = this.imageProcessed.reshaped_input_sizes[0];
    const points = this.lastPoints
      .map((x) => [x.position[0] * reshaped[1], x.position[1] * reshaped[0]])
      .flat(Infinity);
    const labels = this.lastPoints.map((x) => BigInt(x.label)).flat(Infinity);

    const num_points = this.lastPoints.length;
    const input_points = new Tensor("float32", points, [1, 1, num_points, 2]);
    const input_labels = new Tensor("int64", labels, [1, 1, num_points]);

    // Generate the mask
    const { pred_masks, iou_scores } = await this.model({
      ...this.imageEmbeddings,
      input_points,
      input_labels,
    });

    // Post-process the mask
    const masks = await this.processor.post_process_masks(
      pred_masks,
      this.imageProcessed.original_sizes,
      this.imageProcessed.reshaped_input_sizes,
    );


    this.isDecoding = false;

    this.updateMaskOverlay(RawImage.fromTensor(masks[0][0]), iou_scores.data);

    // Check if another decode is pending
    if (this.decodePending) {
      this.decodePending = false;
      this.decode();
    }
  }

  updateMaskOverlay(mask: any, scores: any) {
    // Update canvas dimensions (if different)
    if (!this.maskCanvas || !this.maskContext) return;
    if (this.maskCanvas.width !== mask.width || this.maskCanvas.height !== mask.height) {
      this.maskCanvas.width = mask.width;
      this.maskCanvas.height = mask.height;
    }

    // Allocate buffer for pixel data
    const imageData = this.maskContext.createImageData(
      this.maskCanvas.width,
      this.maskCanvas.height,
    );

    // Select best mask
    const numMasks = scores.length; // 3
    let bestIndex = 0;
    for (let i = 1; i < numMasks; ++i) {
      if (scores[i] > scores[bestIndex]) {
        bestIndex = i;
      }
    }

    // Fill mask with colour
    const pixelData = imageData.data;
    for (let i = 0; i < pixelData.length; ++i) {
      if (mask.data[numMasks * i + bestIndex] === 1) {
        const offset = 4 * i;
        pixelData[offset] = 100; // red
        pixelData[offset + 1] = 0; // green
        pixelData[offset + 2] = 0; // blue
        pixelData[offset + 3] = 100; // alpha
      }
    }

    // Draw image data to context
    this.maskContext.putImageData(imageData, 0, 0);
  }

  async createCutOut() {
    if (!this.maskCanvas || !this.maskContext || !this.imageInput) {
      console.error(`Missing one of the following - maskCanvas: ${this.maskCanvas}, maskContext: ${this.maskContext}, imageInput: ${this.imageInput}`)
      return;
    }
    const [w, h] = [this.maskCanvas.width, this.maskCanvas.height];

    // Get the mask pixel data (and use this as a buffer)
    const maskImageData = this.maskContext.getImageData(0, 0, w, h);

    // Create a new canvas to hold the cut-out
    const cutCanvas = new OffscreenCanvas(w, h);
    const cutContext = cutCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;

    // Copy the image pixel data to the cut canvas
    const maskPixelData = maskImageData.data;

    const imagePixelData = this.imageInput.data;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < w * h; ++i) {
      const sourceOffset = 3 * i; // RGB
      const targetOffset = 4 * i; // RGBA
      let x = i % w
      let y = Math.floor(i / w)

      if (maskPixelData[targetOffset + 3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        // Only copy opaque pixels
        for (let j = 0; j < 3; ++j) {
          maskPixelData[targetOffset + j] = imagePixelData[sourceOffset + j];
        }

        // Set alpha value to 255 for full opacity 
        maskPixelData[targetOffset + 3] = 255;
      }
    }

    // resize to elminate transparent pixels
    for (let i = 0; i < w * h; ++i) {
      const targetOffset = 4 * i; // RGBA
      const minOffset = (minY * w + minX) * 4;
      for (let j = 0; j < 4; ++j) {
        maskPixelData[targetOffset + j - minOffset] = maskPixelData[targetOffset + j]
      }
    }
    cutCanvas.width = maxX - minX;
    cutCanvas.height = maxY - minY;
    console.log(cutCanvas.width, cutCanvas.height)
    cutContext.putImageData(maskImageData, 0, 0);

    this.clearPointsAndMask();

    // Download image
    return { imageUrl: URL.createObjectURL(await cutCanvas.convertToBlob()), width: cutCanvas.width, height: cutCanvas.height };
  }

  clearPointsAndMask() {
    // Reset state
    this.isMultiMaskMode = false;
    this.lastPoints = [];

    // Remove points from previous mask (if any)
    document.querySelectorAll(".segment-icon").forEach((e) => e.remove());

    // Reset mask canvas
    if (this.maskContext && this.maskCanvas)
      this.maskContext.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
  }

  getPoint(e: MouseEvent): Point | null {
    // Get bounding box
    const bb = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();

    // Get the mouse coordinates relative to the container
    const mouseX = clamp((e.clientX - bb.left) / bb.width);
    const mouseY = clamp((e.clientY - bb.top) / bb.height);

    return {
      position: [mouseX, mouseY],
      label:
        e.button === 2 // right click
          ? 0 // negative prompt
          : 1, // positive prompt
    };
  }

  handleContainerMouseMove(e: MouseEvent) {
    if (!this.imageEmbeddings || this.isMultiMaskMode) {
      // Ignore mousemove events if the image is not encoded yet,
      // or we are in multi-mask mode
      return;
    }

    const p = this.getPoint(e)
    if (p)
      this.lastPoints = [p];

    this.decode();
  }

  handleContainerMouseDown(e: MouseEvent) {
    const container = e.currentTarget as HTMLCanvasElement;
    if (e.button !== 0 && e.button !== 2) {
      return; // Ignore other buttons
    }
    if (!this.imageEmbeddings || this.isEncoding) {
      return; // Ignore if not encoded yet
    }
    if (!this.isMultiMaskMode) {
      this.lastPoints = [];
      this.isMultiMaskMode = true;
      // this.cutButton.disabled = false;
    }

    const point = this.getPoint(e);
    if (!point) return;
    this.lastPoints.push(point);

    // add icon
    const icon = document.createElement("span")
    icon.appendChild(document.createTextNode(point.label === 1 ? "⭐️" : "❌"));
    icon.style.left = `${point.position[0] * 100}%`;
    icon.style.top = `${point.position[1] * 100}%`;
    icon.style.position = 'absolute';
    icon.style.zIndex = '99999'
    icon.classList.add("segment-icon")
    container.appendChild(icon);

    // Run decode
    this.decode();

  }
}

export const segmentation = new Segmentation('Xenova/slimsam-77-uniform')

type Point = {
  position: number[];
  label: number;
}

// Clamp a value inside a range [min, max]
function clamp(x: number, min = 0, max = 1) {
  return Math.max(Math.min(x, max), min);
}

