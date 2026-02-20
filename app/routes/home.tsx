import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Layers, Clock, ArrowUpRight } from "lucide-react"; // Assuming lucide-react
import Button from "../../components/ui/Button";
import Upload from "../../components/Upload";
import Navbar from "../../components/Navbar"; // Assuming this path
import { createProject, getProjects } from "../../lib/puter.action";
// Import your type definition if it's in a separate file, e.g.:
// import { DesignItem } from "../../types";

export function meta() {
  return [
    { title: "Roomify - AI Design" },
    { name: "description", content: "Visualize and render architectural projects." },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]); // Replace 'any' with 'DesignItem'
  const isCreatingProjectRef = useRef(false);

  // Load projects on mount
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
    // Prevent double submissions
    if (isCreatingProjectRef.current) return;
    isCreatingProjectRef.current = true;

    try {
      const newId = Date.now().toString();
      const name = `Residence ${newId}`;

      const newItem = {
        id: newId,
        name,
        sourceImage: base64Image, // Use the string directly!
        renderedImage: undefined,
        timestamp: Date.now(),
      };

      // 1. Create the project
      const savedProject = await createProject({ item: newItem, visibility: 'private' });

      if (!savedProject) {
        console.error("Failed to create project");
        return;
      }

      // 2. Navigate
      navigate(`/visualizer/${savedProject.id}`, {
        state: {
          initialImage: savedProject.sourceImage,
          initialRendered: null,
          name: savedProject.name
        }
      });

    } catch (error) {
      console.error("Error processing upload:", error);
    } finally {
      isCreatingProjectRef.current = false;
    }
  };
  return (
      <div className="home min-h-screen bg-white text-black font-sans">
        <Navbar />

        <section className="hero flex flex-col items-center text-center pt-20 px-4">
          {/* Announcement Pill */}
          <div className="announce mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800">
            <div className="dot relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <p>Introducing Roomify 2.0</p>
          </div>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl mb-6">
            Build beautiful spaces at the speed of thought with Roomify
          </h1>

          <p className="subtitle max-w-2xl text-lg text-gray-600 mb-10">
            Roomify is an AI-first design environment that helps you visualize, render, and ship architectural projects faster than ever.
          </p>

          <div className="actions flex gap-4 justify-center mb-20">
            <a
                href="#upload"
                className="cta inline-flex items-center justify-center rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              Start Building <ArrowRight className="ml-2 h-4 w-4" />
            </a>

            <Button variant="outline" size="lg" className="demo">
              Watch Demo
            </Button>
          </div>

          {/* Upload Section */}
          <div id="upload" className="upload-shell relative w-full max-w-3xl mx-auto mb-20">
            {/* Grid Background Effect */}
            <div className="grid-overlay absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="upload-card rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <div className="upload-head mb-8 flex flex-col items-center">
                <div className="upload-icon mb-4 rounded-full bg-blue-50 p-3 text-blue-600">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Upload your floor plan</h3>
                <p className="text-sm text-gray-500">Supports JPG, PNG formats up to 10MB</p>
              </div>

              {/* Pass the handler that accepts a File object */}
              <Upload onComplete={(file) => handleUploadComplete(file)} />
            </div>
          </div>
        </section>

        {/* Projects Grid Section */}
        <section className="projects bg-gray-50 py-20 px-4">
          <div className="section-inner max-w-7xl mx-auto">
            <div className="section-head mb-10">
              <h2 className="text-3xl font-bold mb-2">Projects</h2>
              <p className="text-gray-600">Your latest work and shared community projects, all in one place.</p>
            </div>

            <div className="projects-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map(({ id, name, renderedImage, sourceImage, timestamp }) => (
                  <div
                      key={id}
                      onClick={() => navigate(`/visualizer/${id}`)}
                      className="project-card group cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md border border-gray-100"
                  >
                    <div className="preview relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <img
                          src={renderedImage || sourceImage}
                          alt={name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="badge absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-800 backdrop-blur-sm">
                        Community
                      </div>
                    </div>

                    <div className="card-body p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{name}</h3>
                        <div className="meta mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{new Date(timestamp).toLocaleDateString()}</span>
                          <span>• By User</span>
                        </div>
                      </div>
                      <div className="arrow text-gray-300 transition-colors group-hover:text-gray-900">
                        <ArrowUpRight size={20} />
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