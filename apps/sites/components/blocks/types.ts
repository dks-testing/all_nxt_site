import type { BlockProps, BlockType } from "@platform/db/blocks";
import type { SiteBundle } from "@platform/db";
import type { SiteCtx } from "@/lib/data";

export type BlockComponentProps<T extends BlockType> = {
  ctx: SiteCtx;
  bundle: SiteBundle;
  props: BlockProps<T>;
  id: string;
  index: number;
  pageSlug: string;
};
