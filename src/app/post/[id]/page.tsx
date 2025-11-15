"use client";
import { useParams } from "next/navigation";
import PostDetail from "@/app/components/Post/PostDetail";

export default function PostDetailPage() {
  const params = useParams();
  return <PostDetail postId={Number(params?.["id"])} />;
}
