import { useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useListTagsQuery } from "../../../entities/card/api/cardApi";
import type { Card, CardInput } from "../../../entities/card/model/types";

export type CardFormProps = {
  card?: Card;
  submitLabel?: string;
  onSubmit: (input: CardInput) => Promise<void>;
  onCancel?: () => void;
};


export function useCardForm({ card, onSubmit }: CardFormProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [backText, setBackText] = useState(card?.backText ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(card?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: availableTags = [] } = useListTagsQuery();

  const tagOptions = useMemo(() => {
    const selected = new Set(selectedTags);
    return availableTags.filter((tag) => !selected.has(tag));
  }, [availableTags, selectedTags]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ title, frontText: title, backText, tags: selectedTags });
      if (!card) {
        setTitle("");
        setBackText("");
        setSelectedTags([]);
        setTagDraft("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function addTag(rawTag = tagDraft) {
    const tag = rawTag.trim().toLowerCase();
    if (!tag || selectedTags.includes(tag)) {
      setTagDraft("");
      return;
    }

    setSelectedTags((tags) => [...tags, tag]);
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setSelectedTags((tags) => tags.filter((item) => item !== tag));
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  }

  return { title, setTitle, backText, setBackText, selectedTags, tagDraft, setTagDraft, tagOptions, isSubmitting, handleSubmit, addTag, removeTag, handleTagKeyDown };
}
