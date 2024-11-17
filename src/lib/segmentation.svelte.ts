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
  samModelId: string;
  isDecoding: boolean = false;
  isEncoding: boolean = $state(false);
  decodePending: boolean = false;
  canvas?: HTMLCanvasElement;


  constructor(samModelId: string) {
    this.samModelId = samModelId
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
    const imageInput = await RawImage.fromURL(image_url);
    this.imageProcessed = await this.processor(imageInput);
    if (this.imageProcessed)
      this.imageEmbeddings = await this.model.get_image_embeddings(this.imageProcessed);
    this.isEncoding = false;
  }

  async decode(lastPoints: Point[]) {
    // Prepare inputs for decoding
    if (!this.processor || !this.model || !this.imageProcessed || !this.imageEmbeddings) return;


    if (this.isDecoding) {
      this.decodePending = true;
      return;
    }
    this.isDecoding = true;

    const reshaped = this.imageProcessed.reshaped_input_sizes[0];
    const points = lastPoints
      .map((x) => [x.position[0] * reshaped[1], x.position[1] * reshaped[0]])
      .flat(Infinity);
    const labels = lastPoints.map((x) => BigInt(x.label)).flat(Infinity);

    const num_points = lastPoints.length;
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

    // updateMaskOverlay(RawImage.fromTensor(masks[0][0]), iou_scores.data);

    // Check if another decode is pending
    if (this.decodePending) {
      this.decodePending = false;
      this.decode(lastPoints);
    }
  }
}

type Point = {
  position: number[];
  label: number;
}

// Clamp a value inside a range [min, max]
function clamp(x: number, min = 0, max = 1) {
  return Math.max(Math.min(x, max), min);
}

function getPoint(e: MouseEvent, imageContainer: HTMLImageElement): Point {
  // Get bounding box
  const bb = imageContainer.getBoundingClientRect();

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
