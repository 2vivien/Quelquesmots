"use client";

import { usePublish } from "../hooks/usePublish";
import { useStudioDraft } from "../hooks/useStudioDraft";
import { useStudioStore } from "../stores/studio.store";
import { CharCounter } from "./CharCounter";
import { EditorSurface } from "./EditorSurface";
import { PreviewPane } from "./PreviewPane";
import { PublishDialog } from "./PublishDialog";
import { StudioHeader } from "./StudioHeader";
import { ThemePicker } from "./ThemePicker";
import { TitleField } from "./TitleField";
import { VisibilitySelect } from "./VisibilitySelect";

/** Écran complet du Studio d'écriture (tags unifiés avec les thèmes). */
export function StudioScreen({ draftId }: { draftId?: string }) {
  const store = useStudioStore();
  const { saveNow, applyDoc } = useStudioDraft(draftId);
  const { publishing, publish } = usePublish(saveNow);
  const canPublish = store.title.trim().length >= 3 && store.contentText.trim().length >= 20 && store.themeSlugs.length >= 1 && store.themeSlugs.length <= 5;

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <StudioHeader saveStatus={store.saveStatus} previewOpen={store.previewOpen} canPublish={canPublish} onSave={() => void saveNow()} onTogglePreview={() => store.setField("previewOpen", !store.previewOpen)} onOpenPublish={() => store.setField("publishOpen", true)} />
      {store.previewOpen ? (
        <PreviewPane title={store.title} contentJson={store.contentJson} tags={store.themeSlugs} />
      ) : (
        <div className="space-y-6 rounded-[16px] border border-bord bg-carte p-6 sm:p-8">
          <TitleField value={store.title} onChange={(v) => store.setField("title", v)} />
          <EditorSurface content={store.contentJson} onUpdate={applyDoc} />
          <div className="space-y-4 border-t border-bord pt-4">
            <ThemePicker selected={store.themeSlugs} onChange={(v) => store.setField("themeSlugs", v)} />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <VisibilitySelect value={store.visibility} onChange={(v) => store.setField("visibility", v)} />
              <CharCounter length={store.contentText.length} />
            </div>
          </div>
        </div>
      )}
      <PublishDialog open={store.publishOpen} title={store.title} publishing={publishing} onCancel={() => store.setField("publishOpen", false)} onConfirm={() => void publish()} />
    </div>
  );
}
