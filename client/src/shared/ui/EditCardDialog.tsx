import { Dialog } from "@radix-ui/themes";
import type { ReactNode } from "react";

type Props = { children: ReactNode; onClose: () => void; busy?: boolean };

export function EditCardDialog({ children, onClose, busy = false }: Props) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Dialog.Content className="edit-dialog" maxWidth="720px" aria-describedby={undefined}>
        <Dialog.Title>Редактировать карточку</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
}
