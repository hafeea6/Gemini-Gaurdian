"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

const Header = () => {
  return (
    <Box
      component="header"
      sx={{
        gridColumn: "1 / -1",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "common.white",
            fontWeight: 700
          }}
        >
          G
        </Box>
        <Typography variant="h6">GEMINI GUARDIAN</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          HYBRID AI ARCHITECTURE · REASONING CORE: FLASH 3.0
        </Typography>
      </Box>
      <Button color="error" variant="contained" size="small">
        ALERT EMS
      </Button>
    </Box>
  );
};

export default Header;
