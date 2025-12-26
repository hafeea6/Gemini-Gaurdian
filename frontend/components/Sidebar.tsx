"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface Props {
  missionLog: string[];
}

const Sidebar = ({ missionLog }: Props) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            CURRENT DIRECTIVE
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "rgba(154,160,166,0.08)",
              fontWeight: 700
            }}
          >
            WAITING FOR ASSESSMENT ...
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            MISSION LOG
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "rgba(154,160,166,0.08)"
            }}
          >
            {missionLog.length === 0 ? (
              <Typography color="text.secondary">No entries</Typography>
            ) : (
              missionLog.map((m, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography
                    color={
                      m.toLowerCase().includes("error")
                        ? "error"
                        : "text.secondary"
                    }
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {m}
                  </Typography>
                </Box>
              ))
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              GUARDIAN AI • 14:13:12
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Sidebar;
