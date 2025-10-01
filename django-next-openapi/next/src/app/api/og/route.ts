import { ImageResponse } from "next/og";
import { RenderIMGEl } from "~/components/OGImgEl";
import { siteUrl } from "~/config/site";
import Logo from "public/icons/512.png";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    return new ImageResponse(
      RenderIMGEl({
        logo: siteUrl + Logo.src,
        image: siteUrl + Logo.src,
      }),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
