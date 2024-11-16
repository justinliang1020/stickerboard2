import {
  SamModel,
  AutoProcessor,
  RawImage,
  Tensor,
  Processor,
} from "@huggingface/transformers"

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
export type ImageProcessed = { pixel_values: Tensor };
export type ImageEmbeddings = {
  image_embeddings: Tensor;
  image_positional_embeddings: Tensor;
};

export async function setup_sam_model(model_id: string): Promise<{ processor: Processor, model: SamModel }> {
  const processor = await AutoProcessor.from_pretrained(model_id);
  //TODO: what to do if webgpu is not available
  const model = (await SamModel.from_pretrained(model_id, {
    dtype: 'fp16',
    device: 'webgpu'
  })) as SamModel;
  return { processor, model }
}


export async function encode(image_url: string, processor: Processor, model: SamModel): Promise<{ imageProcessed: ImageProcessed, imageEmbeddings: ImageEmbeddings }> {
  const imageInput = await RawImage.fromURL(image_url);
  const imageProcessed = (await processor(imageInput)) as { pixel_values: Tensor };
  const imageEmbeddings = await model.get_image_embeddings(imageProcessed);
  return { imageProcessed, imageEmbeddings }
}
