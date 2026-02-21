import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Layers, Clock, ArrowUpRight } from "lucide-react";
import Button from "../../components/ui/Button";
import Upload from "../../components/Upload";
import Navbar from "../../components/Navbar";
import { createProject, getProjects } from "../../lib/puter.action";

export function meta() {
  return [
    { title: "Roomify - AI Design" },
    { name: "description", content: "Visualize and render architectural projects." },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const isCreatingProjectRef = useRef(false);

  // --- NEW: Style Selection State ---
  const [selectedStyle, setSelectedStyle] = useState("Modern Minimalist");

  const designStyles = [
    { id: "Modern Minimalist", icon: "✨", desc: "Clean lines, neutral tones" },
    { id: "Industrial Loft", icon: "🧱", desc: "Exposed brick, raw metals" },
    { id: "Japanese Zen", icon: "🎋", desc: "Natural wood, warm lighting" },
    { id: "Mid-Century", icon: "🛋️", desc: "Retro furniture, bold colors" }
  ];
  // ----------------------------------

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const items = await getProjects();
        setProjects(items);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };
    fetchProjects();
  }, []);

  const handleUploadComplete = async (base64Image: string) => {
    if (isCreatingProjectRef.current) return;
    isCreatingProjectRef.current = true;

    try {
      const newId = Date.now().toString();
      const name = `Residence ${newId}`;

      const newItem = {
        id: newId,
        name,
        sourceImage: base64Image,
        renderedImage: undefined,
        timestamp: Date.now(),
      };

      const savedProject = await createProject({ item: newItem, visibility: 'private' });

      if (!savedProject) {
        console.error("Failed to create project");
        return;
      }

      // --- UPDATED: Passing the selectedStyle in the navigation state ---
      navigate(`/visualizer/${savedProject.id}`, {
        state: {
          initialImage: savedProject.sourceImage,
          initialRendered: null,
          name: savedProject.name,
          style: selectedStyle // Passes the user's choice to the next page!
        }
      });

    } catch (error) {
      console.error("Error processing upload:", error);
    } finally {
      isCreatingProjectRef.current = false;
    }
  };

  return (
      <div className="home min-h-screen bg-white text-black font-sans selection:bg-orange-100 selection:text-orange-900">
        <Navbar />

        {/* --- PREMIUM HERO SECTION --- */}
        <section className="hero relative flex flex-col items-center text-center pt-32 px-4 pb-20 overflow-hidden">

          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-500/10 to-orange-400/20 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

          <div className="announce mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200/50 bg-white/60 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="dot relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </div>
            <p>Introducing Roomify 2.0</p>
          </div>

          <h1 className="max-w-5xl text-6xl font-extrabold tracking-tight sm:text-8xl mb-8 text-transparent bg-clip-text bg-gradient-to-b from-gray-900 via-gray-800 to-gray-500">
            Build beautiful spaces <br/> at the speed of thought.
          </h1>

          <p className="subtitle max-w-2xl text-xl text-gray-500 mb-12 font-light tracking-wide">
            An AI-first design environment to visualize, render, and ship architectural projects faster than ever.
          </p>

          <div className="actions flex flex-col sm:flex-row gap-4 justify-center mb-24 z-10">
            <a
                href="#upload"
                className="group relative inline-flex items-center justify-center rounded-full bg-gray-900 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] hover:bg-black"
            >
              Start Building
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <Button variant="outline" size="lg" className="rounded-full px-8 py-4 border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all">
              Watch Demo
            </Button>
          </div>

          {/* --- FUNNEL: STYLE SELECTOR & UPLOAD --- */}
          <div id="upload" className="w-full max-w-4xl mx-auto z-10 scroll-mt-32">

            {/* Step 1: Style Grid */}
            <div className="mb-12">
              <div className="text-center mb-6">
                <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">1. Choose your aesthetic</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {designStyles.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`relative flex flex-col items-center p-5 rounded-3xl border transition-all duration-300 text-left w-full h-full
                    ${selectedStyle === style.id
                            ? 'bg-orange-50/50 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] scale-105 z-10'
                            : 'bg-white border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-3xl mb-3">{style.icon}</span>
                      <span className={`font-bold text-sm mb-1 text-center ${selectedStyle === style.id ? 'text-orange-600' : 'text-gray-900'}`}>
                    {style.id}
                  </span>
                      <span className="text-xs text-gray-500 text-center leading-relaxed">
                    {style.desc}
                  </span>

                      {selectedStyle === style.id && (
                          <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></div>
                      )}
                    </button>
                ))}
              </div>
            </div>

            {/* Step 2: File Upload */}
            <div className="text-center mb-6">
              <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">2. Upload your space</h3>
            </div>

            <div className="upload-shell relative w-full">
              <div className="grid-overlay absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] rounded-3xl"></div>

              <div className="upload-card rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-xl p-10 shadow-xl">
                <div className="upload-head mb-8 flex flex-col items-center">
                  <div className="upload-icon mb-4 rounded-full bg-orange-50 p-4 text-orange-600 shadow-sm border border-orange-100">
                    <Layers className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900">Upload your floor plan</h3>
                  <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG formats up to 10MB</p>
                </div>

                <Upload onComplete={(file) => handleUploadComplete(file)} />
              </div>
            </div>
          </div>
        </section>

        {/* --- PROJECTS GALLERY --- */}
        <section className="projects bg-[#f8fafc] py-24 px-4 border-t border-gray-100">
          <div className="section-inner max-w-7xl mx-auto">
            <div className="section-head mb-12 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight text-gray-900">Recent Projects</h2>
                <p className="text-gray-500 text-lg">Your latest architectural renders and visualizations.</p>
              </div>
            </div>

            <div className="projects-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map(({ id, name, renderedImage, sourceImage, timestamp }) => (
                  <div
                      key={id}
                      onClick={() => navigate(`/visualizer/${id}`)}
                      className="project-card group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 border border-gray-100"
                  >
                    <div className="preview relative aspect-[4/3] overflow-hidden bg-gray-100 border-b border-gray-100">
                      <img
                          src={renderedImage || sourceImage}
                          alt={name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="card-body p-6 flex justify-between items-start bg-white">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1 tracking-tight">{name}</h3>
                        <div className="meta flex items-center gap-2 text-xs font-medium text-gray-500">
                          <Clock size={14} className="text-orange-500" />
                          <span>{new Date(timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="arrow flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 transition-all duration-300 group-hover:bg-gray-900 group-hover:text-white group-hover:rotate-45">
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>
      </div>
  );
}