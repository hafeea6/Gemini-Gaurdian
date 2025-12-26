"use client";

interface Props {
  missionLog: string[];
}

const Sidebar = ({ missionLog }: Props) => {
  return (
    <div className="sidebar p-4">
      <div className="directive mb-6">
        <div className="text-xs text-gg-muted">CURRENT DIRECTIVE</div>
        <div className="mt-2 rounded bg-gg-muted/8 p-4 text-lg font-semibold">
          WAITING FOR ASSESSMENT ...
        </div>
      </div>

      <div className="mission-log">
        <div className="text-xs text-gg-muted mb-2">MISSION LOG</div>
        <div className="rounded bg-gg-muted/8 p-3 text-sm">
          {missionLog.length === 0 ? (
            <div className="text-gg-muted">No entries</div>
          ) : (
            missionLog.map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${
                  m.toLowerCase().includes("error")
                    ? "text-red-300"
                    : "text-gg-muted"
                }`}
              >
                <pre className="whitespace-pre-wrap">{m}</pre>
              </div>
            ))
          )}

          <div className="mt-3 text-xs text-gg-muted">
            GUARDIAN AI • 14:13:12
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
