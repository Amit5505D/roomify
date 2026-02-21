import puter from "@heyputer/puter.js";
import { getDynamicPrompt } from "./constants";

// 1. Define the parameters so TypeScript knows 'style' is an option
export interface Generate3DViewParams {
    sourceImage: string;
    style?: string; // Make it optional so it doesn't break existing code
}

export const fetchAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// 2. Add 'style' to the destructured arguments with a default fallback
export const generate3DView = async ({ sourceImage, style = "Modern Minimalist" }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1];

    if(!mimeType || !base64Data) throw new Error('Invalid source image payload');

    // 3. Generate the dynamic prompt using the style
    const prompt = getDynamicPrompt(style);

    // 4. Pass the new 'prompt' variable instead of the old constant
    const response = await puter.ai.txt2img(prompt, {
        provider: "gemini",
        model: "gemini-2.5-flash-image-preview",
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 },
    });

    const rawImageUrl = (response as HTMLImageElement).src ?? null;

    if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

    const renderedImage = rawImageUrl.startsWith('data:')
        ? rawImageUrl : await fetchAsDataUrl(rawImageUrl);

    return { renderedImage, renderedPath: undefined };
}