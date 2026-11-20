import {
  ComponentPreview,
  DocumentMenu,
  ScreenLayout,
  defineScreen,
  ui,
  useAssistantContext,
  useDocument,
  useScreenRoute,
  useSession,
} from 'handoff-app/screens';
import { notes } from './collections';

function {{component}}() {
  const { params, navigate } = useScreenRoute();
  const noteId = params[0];
  const note = useDocument(notes, noteId);
  const { canWrite } = useSession();
  // Tells the assistant which note is open, so it can act on requests like "link the button to this note".
  useAssistantContext({ noteId });

  const componentIds = note.data?.componentIds ?? [];

  return (
    <ScreenLayout
      assistant
      toolbar={
        <>
          <DocumentMenu collection={notes} current={noteId} onOpen={(id) => navigate(id ? [id] : [])} noun="note" />
          <ScreenLayout.Divider />
          <ScreenLayout.Status document={note} />
        </>
      }
      left={
        <ScreenLayout.Panel title="Linked components" count={componentIds.length}>
          <div className="flex flex-col gap-2">
            {componentIds.map((componentId) => (
              <div key={componentId} className="flex flex-col gap-1.5">
                <ui.ListRow
                  title={componentId}
                  icon="component"
                  actions={
                    canWrite && (
                      <ScreenLayout.Action
                        icon="x"
                        label="Unlink"
                        onClick={() => note.update((current) => ({ ...current, componentIds: current.componentIds.filter((id) => id !== componentId) }))}
                      />
                    )
                  }
                />
                <ComponentPreview id={componentId} thumbnail />
              </div>
            ))}
            {componentIds.length === 0 && <p className="text-[13px] text-muted-foreground">Ask the assistant to link a component.</p>}
          </div>
        </ScreenLayout.Panel>
      }
    >
      {note.data ? (
        <textarea
          aria-label="Note"
          className="h-full w-full resize-none bg-transparent p-6 text-sm leading-relaxed outline-none"
          placeholder="Write here…"
          value={note.data.body}
          readOnly={!canWrite}
          onChange={(event) => note.update((current) => ({ ...current, body: event.target.value }))}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-8">
          <ui.EmptyState icon="notebook-pen" title="No note open" description="Create a note with the menu in the toolbar." />
        </div>
      )}
    </ScreenLayout>
  );
}

export default defineScreen({
  title: '{{title}}',
  description: 'Notes about the design system, with linked components.',
  icon: 'notebook-pen',
  component: {{component}},
});
