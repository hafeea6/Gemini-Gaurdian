"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

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
    <Card>
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: "text.secondary",
              color: "background.paper"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM5 10v1a7 7 0 0 0 14 0v-1" />
            </svg>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              SESSION CONTROL
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {active ? "LINK ACTIVE" : "NO ACTIVE LINK"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!active) {
                const ok = await onRequestPermissions();
                if (ok) onToggle();
              } else {
                onToggle();
              }
            }}
          >
            {active ? "END SESSION" : "START SESSION"}
          </Button>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: "text.secondary",
              color: "background.paper"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3v18" />
            </svg>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SessionControl;
