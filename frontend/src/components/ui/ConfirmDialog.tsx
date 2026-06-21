import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

interface State extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ open: false });

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, open: true, resolve });
    });
  }, []);

  function close(result: boolean) {
    state.resolve?.(result);
    setState((s) => ({ ...s, open: false }));
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={state.open} onClose={() => close(false)} size="sm">
        <div className="text-center">
          <div
            className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
              state.danger ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
            }`}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">
            {state.title ?? "Are you sure?"}
          </h3>
          {state.message && (
            <p className="mt-1 text-sm text-slate-500">{state.message}</p>
          )}
          <div className="mt-6 flex gap-3">
            <button className="btn-outline flex-1" onClick={() => close(false)}>
              {state.cancelText ?? "Cancel"}
            </button>
            <button
              className={`${state.danger ? "btn-danger" : "btn-primary"} flex-1`}
              onClick={() => close(true)}
            >
              {state.confirmText ?? "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
