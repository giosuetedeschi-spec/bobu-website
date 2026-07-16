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
  { label: "Programming", items: ["TypeScript", "Python", "Rust", "Java", "React", "Next.js"] },
  { label: "Tools", items: ["Git", "Docker", "Linux", "WASM"] },
  { label: "Languages", items: ["Italian (native)", "English (good)", "Spanish (A2)"] },
  { label: "Creative", items: ["Creative writing", "Podcast production", "Video direction", "Calligraphy"] },
];

const experience = [
  {
    title: "Python & Cryptography Teaching Assistant — I.I.S. Liceo Classico Cavour",
    period: "2023 - 2024",
    description:
      "Technical assistant for Python and cryptographic-systems lessons: deepened course topics and helped students through individual problems.",
  },
  {
    title: "Co-founder & Writer — Mercuzio & Friends",
    period: "2022 - Present",
    description:
      "Cultural collective in Torino: writing, mediation, collaborations with city institutions, video direction, podcast design.",
  },
  {
    title: "Radio Collaborator — Radio erre18",
    period: "2024 - Present",
    description:
      "Episode planning, mixer operation and streaming software for live radio programming.",
  },
  {
    title: "Production Member — Amaro (student cultural journal)",
    period: "2022 - 2023",
    description:
      "Article writing, proofreading, print-shop relations, distribution, and video-podcast direction.",
  },
  {
    title: "Events Staff — Salone del Libro, Torino Comics, TEDxTorino, Club Silencio",
    period: "2019 - 2024",
    description:
      "Reception, crowd flow, stand and stage setup, speaker preparation, materials logistics across Torino's main cultural events. Jury member for the LiberAzioni film festival (AMNC, 2023).",
  },
];

const education = [
  {
    title: "Liceo Scientifico Ettore Majorana, Torino",
    period: "2016 - 2021",
    description: "Diploma di maturità scientifica — mathematics, physics, philosophy.",
  },
  {
    title: "Scuola Holden — writing program",
    period: "2023",
    description:
      "Group work with established writers (Kate Williams, Adam Gollner, Amidon Steven): short stories, copy, TV series, novel outline.",
  },
  {
    title: "\"Diventare Imprenditori\" — Università di Torino",
    period: "2022",
    description:
      "Business Model Canvas, market analysis, marketing principles, business plans and startup finance.",
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
          Developer & Creative Technologist
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip icon={<WorkIcon sx={{ fontSize: 16 }} />} label="Torino, IT" size="small" variant="outlined" />
          <Chip label="giosue.tedeschi31@gmail.com" size="small" variant="outlined" />
          <Chip label="Full CV (PDF)" size="small" variant="outlined" component="a" href="/cv.pdf" target="_blank" clickable />
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
