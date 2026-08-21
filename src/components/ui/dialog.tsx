import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export function DialogContent({ className, children, ...props }: DialogPrimitive.DialogContentProps) { return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 bg-slate-950/45" /><DialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-6 shadow-xl', className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Đóng"><X /></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal> }
export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-1.5', className)} {...props} />
export const DialogTitle = ({ className, ...props }: DialogPrimitive.DialogTitleProps) => <DialogPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} />
export const DialogDescription = ({ className, ...props }: DialogPrimitive.DialogDescriptionProps) => <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('mt-6 flex justify-end gap-3', className)} {...props} />
