"use client";

interface Props {
  onStart: () => void | Promise<void>;
  permissionStatus?: string;
}

const HeroCard = ({ onStart, permissionStatus }: Props) => {
  return (
    <section className="card relative overflow-hidden">
      <div className="flex items-center justify-center py-16 px-8">
        <div className="text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gg-accent/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gg-accent"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold">SYSTEM READY</h2>
          <p className="mt-3 text-gg-muted max-w-xl mx-auto">
            Establish a secure link for real-time visual triage and life-saving
            medical guidance.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onStart()}
              className="btn-primary inline-flex items-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M12 5v14M5 12h14" strokeWidth={0} />
              </svg>
              START GUARDIAN SESSION
            </button>
          </div>

          {permissionStatus && (
            <div className="mt-3 text-sm text-gg-muted">
              Permission: {permissionStatus}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroCard;
