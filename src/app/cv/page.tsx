import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import CodeIcon from "@mui/icons-material/Code";

const skills = [
  { label: "Languages", items: ["TypeScript", "Rust", "Python", "C++", "Java"] },
  { label: "Frontend", items: ["Next.js", "React", "Tailwind CSS", "Framer Motion"] },
  { label: "Backend", items: ["Spring Boot", "Node.js", "PostgreSQL", "MongoDB"] },
  { label: "Tools", items: ["Git", "Docker", "Linux", "WASM"] },
];

const experience = [
  {
    title: "Full Stack Developer",
    period: "2023 - Present",
    description:
      "Building modern web applications with Next.js and Spring Boot. Leading frontend architecture decisions and implementing performance-critical modules.",
  },
  {
    title: "Creative Coder",
    period: "2021 - 2023",
    description:
      "Developed interactive websites, generative art pieces, and browser-based games using Three.js, React, and Rust.",
  },
  {
    title: "ITS Student",
    period: "2021 - Present",
    description:
      "Studying software engineering and web technologies at ITS Piemonte. Focus on full-stack development and system design.",
  },
];

const education = [
  {
    title: "ITS Piemonte",
    period: "2021 - Present",
    description:
      "Higher Education in Software Engineering and Web Development.",
  },
];

export default function ResumePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "2.5rem", md: "3.5rem" },
            fontWeight: 800,
            letterSpacing: "-0.03em",
            mb: 1,
          }}
        >
          Giosu&egrave; &quot;Bobu&quot; Tedeschi
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 2 }}>
          Full Stack Engineer & Creative Technologist
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip icon={<WorkIcon sx={{ fontSize: 16 }} />} label="Milan, IT" size="small" variant="outlined" />
          <Chip label="giosue.tedeschi@edu-its.it" size="small" variant="outlined" />
        </Box>
      </Box>

      <Divider sx={{ mb: 5 }} />

      {/* Experience */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <WorkIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Experience
          </Typography>
        </Box>
        <Stack spacing={3}>
          {experience.map((exp, i) => (
            <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { sm: "center" },
                    mb: 1,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {exp.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                    {exp.period}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {exp.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Education */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <SchoolIcon color="secondary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Education
          </Typography>
        </Box>
        <Stack spacing={3}>
          {education.map((edu, i) => (
            <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { sm: "center" },
                    mb: 1,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {edu.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                    {edu.period}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {edu.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Skills */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <CodeIcon sx={{ color: "#0ea5e9" }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Technical Skills
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {skills.map((skill) => (
            <Grid size={{xs: 12, sm: 6}} key={skill.label}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1.5, color: "primary.main" }}
                  >
                    {skill.label}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {skill.items.map((item) => (
                      <Chip key={item} label={item} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
