"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

interface Props {
  onStart: () => void | Promise<void>;
  permissionStatus?: string;
}

const HeroCard = ({ onStart, permissionStatus }: Props) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.1
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            SYSTEM READY
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 2, maxWidth: 600, mx: "auto" }}
          >
            Establish a secure link for real-time visual triage and life-saving
            medical guidance.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onStart()}
              size="large"
            >
              START GUARDIAN SESSION
            </Button>
          </Box>
          {permissionStatus && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Permission: {permissionStatus}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HeroCard;
