import * as React from "react"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 4000

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const listeners = []
let memoryToasts = []

function dispatch(action) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryToasts = [{ ...action.toast, id: genId(), open: true }, ...memoryToasts].slice(0, TOAST_LIMIT)
      break
    case "DISMISS_TOAST": {
      const { toastId } = action
      memoryToasts = memoryToasts.map((t) => (t.id === toastId || toastId === undefined ? { ...t, open: false } : t))
      break
    }
    case "REMOVE_TOAST":
      memoryToasts = action.toastId ? memoryToasts.filter((t) => t.id !== action.toastId) : []
      break
    default:
      break
  }
  listeners.forEach((listener) => listener(memoryToasts))
}

let timeouts = new Map()
function scheduleRemoval(toastId) {
  if (timeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    timeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  timeouts.set(toastId, timeout)
}

export function toast({ ...props }) {
  const id = genId()
  dispatch({ type: "ADD_TOAST", toast: { ...props, id } })
  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) }
}

toast.success = (props) => toast({ ...props })
toast.destructive = (props) => toast({ variant: "destructive", ...props })

export function useToast() {
  const [state, setState] = React.useState(memoryToasts)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])
  return {
    toasts: state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export function Toaster() {
  const { toasts } = useToast()
  React.useEffect(() => {
    toasts.forEach((t) => scheduleRemoval(t.id))
  }, [toasts])
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
