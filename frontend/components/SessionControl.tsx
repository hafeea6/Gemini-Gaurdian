"use client";

interface Props {
  active: boolean;
  onToggle: () => void;
  onRequestPermissions: () => Promise<boolean>;
  permissionStatus: string;
}

const SessionControl = ({
  active,
  onToggle,
  onRequestPermissions,
  permissionStatus
}: Props) => {
  return (
    <section className="card flex items-center justify-between p-6">
      <div className="flex items-center gap-6">
        <div className="rounded-md bg-gg-muted/10 p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gg-muted"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 1a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM5 10v1a7 7 0 0 0 14 0v-1" />
          </svg>
        </div>
        <div>
          <div className="text-sm text-gg-muted">SESSION CONTROL</div>
          <div className="text-sm font-semibold">
            {active ? "LINK ACTIVE" : "NO ACTIVE LINK"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={async () => {
            if (!active) {
              const ok = await onRequestPermissions();
              if (ok) onToggle();
            } else {
              onToggle();
            }
          }}
          className="btn-start"
        >
          {active ? "END SESSION" : "START SESSION"}
        </button>
        <div className="p-2 rounded bg-gg-muted/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gg-muted"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3v18" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default SessionControl;
