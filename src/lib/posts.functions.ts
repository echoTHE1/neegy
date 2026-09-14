import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const posts = () => import("./nexus/posts.server");

const token = z.string().min(8).max(300);

export const listPublicPostsFn = createServerFn({ method: "GET" }).handler(async () =>
  (await posts()).listPublicPosts(),
);

export const ownerUnlockFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => (await posts()).ownerUnlock(data.password));

export const ownerCheckFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token }).parse(data))
  .handler(async ({ data }) => (await posts()).ownerCheck(data.token));

export const listAllPostsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token }).parse(data))
  .handler(async ({ data }) => (await posts()).listAllPosts(data.token));

export const createPostFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token,
        title: z.string().min(1).max(200),
        content: z.string().max(4000),
        url: z.string().max(2000).nullable().optional(),
        category: z.string().max(40).optional(),
        pinned: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await posts()).createPost(data));

export const updatePostFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token,
        postId: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().max(4000).optional(),
        url: z.string().max(2000).nullable().optional(),
        category: z.string().max(40).optional(),
        pinned: z.boolean().optional(),
        published: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await posts()).updatePost(data));

export const deletePostFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token, postId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => (await posts()).deletePost(data));

export const reorderPostsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token, postIds: z.array(z.string().uuid()).max(200) }).parse(data),
  )
  .handler(async ({ data }) => (await posts()).reorderPosts(data));
