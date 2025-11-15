"use client";

import { Hash, Loader2, X } from "lucide-react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { toast } from "react-toastify";
import type { CreatePostFormValues } from "@/utils/schema";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface Tag {
  id: number;
  name: string;
  community_id: number;
}

type CreatePostFormData = CreatePostFormValues;

interface TagSectionProps {
  control: Control<CreatePostFormData>;
  watchCommunityId: number | null;
  tagsData: Tag[];
  newTagName: string;
  setNewTagName: (name: string) => void;
  isCreatingTag: boolean;
  relatedTags: Array<{ id: number; name: string; relationScore: number }>;
  isLoadingRelatedTags: boolean;
  similarTags: Array<{ id: number; name: string }>;
  isLoadingSimilarTags: boolean;
  errors: FieldErrors<CreatePostFormData>;
  onCreateTag: (selectedTagIds: number[]) => Promise<void> | void;
  onSelectSimilarTag: (
    tag: { id: number; name: string },
    selectedTagIds: number[],
  ) => void;
}

const MAX_TAG_SELECTION = 3;

const TagSection = ({
  control,
  watchCommunityId,
  tagsData,
  newTagName,
  setNewTagName,
  isCreatingTag,
  relatedTags,
  isLoadingRelatedTags,
  similarTags,
  isLoadingSimilarTags,
  errors,
  onCreateTag,
  onSelectSimilarTag,
}: TagSectionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  if (!watchCommunityId || watchCommunityId <= 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-800/80 dark:to-gray-900/80 rounded-xl border-2 border-blue-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <Label
          htmlFor="tag_ids"
          className="text-lg font-semibold text-gray-700 dark:text-gray-200"
        >
          {t("create.post.tag.title")}
        </Label>
      </div>

      <Controller
        name="tag_ids"
        control={control}
        render={({ field }) => {
          const selectedTagIds = (field.value as number[]) || [];
          const canSelectMore = selectedTagIds.length < MAX_TAG_SELECTION;

          const handleTagToggle = (tagId: number) => {
            if (selectedTagIds.includes(tagId)) {
              field.onChange(selectedTagIds.filter((id) => id !== tagId));
              return;
            }
            if (!canSelectMore) {
              toast.warn(`タグは最大${MAX_TAG_SELECTION}つまで選択できます`);
              return;
            }
            field.onChange([...selectedTagIds, tagId]);
          };

          const handleAddTag = (tagId: number) => {
            if (selectedTagIds.includes(tagId)) {
              return;
            }
            if (!canSelectMore) {
              toast.warn(`タグは最大${MAX_TAG_SELECTION}つまで選択できます`);
              return;
            }
            field.onChange([...selectedTagIds, tagId]);
          };

          const handleClearTags = () => {
            if (selectedTagIds.length === 0) return;
            field.onChange([]);
          };

          const selectedTagDetails = selectedTagIds
            .map((id) => tagsData.find((tag) => tag.id === id))
            .filter(
              (tag): tag is Tag => typeof tag?.id === "number" && !!tag?.name,
            );

          return (
            <>
              {/* 選択したタグの表示エリア */}
              <div className="rounded-lg bg-white dark:bg-gray-900 border-2 border-blue-300 dark:border-blue-700 p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      選択中のタグ
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-xs font-bold text-blue-700 dark:text-blue-300">
                      {selectedTagIds.length}/{MAX_TAG_SELECTION}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={selectedTagIds.length === 0}
                    onClick={handleClearTags}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    すべて解除
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-14 items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                  {selectedTagDetails.length === 0 ? (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                      タグを選択してください（最大3つまで）
                    </span>
                  ) : (
                    selectedTagDetails.map((tag) => (
                      <span
                        key={tag.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        #{tag.name}
                        <button
                          type="button"
                          aria-label="remove tag"
                          onClick={() => handleTagToggle(tag.id)}
                          className="hover:text-red-200 transition-colors rounded-full hover:bg-white/20 p-0.5"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {errors?.tag_ids?.message && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {errors.tag_ids.message as string}
                  </p>
                )}
              </div>

              {/* 選択可能なタグリスト */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    選択可能なタグ（クリックして選択）
                  </p>
                  {!canSelectMore && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                      上限に達しました
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {tagsData.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("create.post.tag.none")}
                    </p>
                  ) : (
                    tagsData.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      const disabled = !isSelected && !canSelectMore;
                      return (
                        <Button
                          key={tag.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          disabled={disabled}
                          onClick={() => handleTagToggle(tag.id)}
                          className={`text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md"
                              : "text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600"
                          } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                        >
                          #{tag.name}
                        </Button>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  💡 ヒント: 複数のタグを選択できます（最大{MAX_TAG_SELECTION}
                  個）
                </p>
              </div>

              {/* 新しいタグの作成 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={
                      user
                        ? t("create.post.tag.create.placeholder")
                        : t("create.post.tag.create.placeholder.login")
                    }
                    value={newTagName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = (
                        e.target as HTMLInputElement & { value: string }
                      ).value;
                      setNewTagName(value);
                    }}
                    className="flex-1"
                    maxLength={20}
                    disabled={!user}
                  />
                  <Button
                    type="button"
                    onClick={() => onCreateTag(selectedTagIds)}
                    disabled={!user || !newTagName.trim() || isCreatingTag}
                    variant="outline"
                    size="sm"
                    className={`${
                      user
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isCreatingTag
                      ? t("create.post.tag.create.button.creating")
                      : t("create.post.tag.create.button")}
                  </Button>
                </div>
                {user ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("create.post.tag.example")}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t("create.post.tag.login.required")}
                  </p>
                )}
              </div>

              {/* 類似タグの表示 */}
              {similarTags.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-yellow-100 dark:bg-yellow-800 rounded">
                      <Hash className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      類似するタグが見つかりました
                    </span>
                    {isLoadingSimilarTags && (
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {similarTags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        onClick={() => onSelectSimilarTag(tag, selectedTagIds)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors"
                      >
                        <span className="text-yellow-700 dark:text-yellow-300">
                          #{tag.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    重複を避けるため、既存のタグをクリックして選択することをお勧めします。
                  </p>
                </div>
              )}

              {/* 関連タグ推奨 */}
              {relatedTags.length > 0 && (
                <div className="space-y-2 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded">
                      <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      おすすめの関連タグ
                    </span>
                    {isLoadingRelatedTags && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {relatedTags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAddTag(tag.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors group"
                      >
                        <span className="text-blue-700 dark:text-blue-300">
                          #{tag.name}
                        </span>
                        <span className="text-blue-500 dark:text-blue-400 text-[10px]">
                          ({Math.round(tag.relationScore * 100)}%)
                        </span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    選択中のタグと関連性の高いタグです。クリックして選択できます。
                  </p>
                </div>
              )}
            </>
          );
        }}
      />
    </div>
  );
};

export default TagSection;
