import { useNavigate, useOutletContext, useParams, useLocation } from "react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import Button from "../../components/ui/Button";
import { createProject, getProjectById } from "../../lib/puter.action";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

// Ensure this matches your actual type
type AuthContext = { userId?: string };

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useOutletContext<AuthContext>();

    // Grab the state passed from the Home page upload (if it exists)
    const navState = location.state as { initialImage?: string; initialRendered?: string; name?: string } | null;

    const hasInitialGenerated = useRef(false);

    // Initialize with navigation state to prevent loading flashes
    const [project, setProject] = useState<any | null>(navState ? {
        id,
        name: navState.name,
        sourceImage: navState.initialImage,
        renderedImage: navState.initialRendered
    } : null);

    // Only show loading initially if we don't have navState
    const [isProjectLoading, setIsProjectLoading] = useState(!navState);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(navState?.initialRendered || null);

    const handleBack = () => navigate('/');

    // Robust Export: Fetches the image as a blob to bypass cross-origin restrictions
    const handleExport = async () => {
        if (!currentImage) return;

        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `roomify-${id || 'design'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(blobUrl); // Cleanup memory
        } catch (error) {
            console.error("Failed to download image:", error);
        }
    };

    // Wrapped in useCallback so it can be safely used in useEffect
    const runGeneration = useCallback(async (item: any) => {
        if (!id || !item.sourceImage) return;

        try {
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: item.sourceImage });

            if (result.renderedImage) {
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                };

                // Note: Ensure this matches how your Puter backend expects the payload
                const saved = await createProject({ item: updatedItem, visibility: "private" });

                if (saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        } catch (error) {
            console.error('Generation failed: ', error);
            // Allow retry if it fails
            hasInitialGenerated.current = false;
        } finally {
            setIsProcessing(false);
        }
    }, [id, userId]);

    // Effect 1: Load Project if it didn't come from navigation state
    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            // Only fetch if we don't already have the sourceImage from router state
            if (!project?.sourceImage) {
                setIsProjectLoading(true);
                const fetchedProject = await getProjectById({ id });

                if (!isMounted) return;

                if (fetchedProject) {
                    setProject(fetchedProject);
                    setCurrentImage(fetchedProject.renderedImage || null);
                }
                setIsProjectLoading(false);
            }
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id, project?.sourceImage]); // Intentionally omitting full 'project' object to avoid loops

    // Effect 2: Trigger AI Generation
    useEffect(() => {
        if (isProjectLoading || hasInitialGenerated.current || !project?.sourceImage) return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading, runGeneration]);

    return (
        <div className="visualizer min-h-screen bg-gray-50 flex flex-col">
            <nav className="topbar flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
                <div className="brand flex items-center gap-2">
                    <Box className="logo w-6 h-6 text-blue-600" />
                    <span className="name font-bold text-xl">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit text-gray-600 hover:text-gray-900">
                    <X className="icon w-4 h-4 mr-2" /> Exit Editor
                </Button>
            </nav>

            <section className="content flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
                {/* Render Panel */}
                <div className="panel flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="panel-header flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="panel-meta">
                            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Project</p>
                            <h2 className="text-lg font-bold text-gray-900">{project?.name || `Residence ${id}`}</h2>
                            <p className="note text-sm text-gray-500">Created by You</p>
                        </div>

                        <div className="panel-actions flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                disabled={!currentImage || isProcessing}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size="sm" onClick={() => {}} className="share bg-blue-600 hover:bg-blue-700 text-white">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area relative flex-1 min-h-[400px] bg-gray-100 flex items-center justify-center overflow-hidden ${isProcessing ? 'is-processing' : ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img w-full h-full object-contain" />
                        ) : (
                            <div className="render-placeholder w-full h-full">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original" className="render-fallback w-full h-full object-contain opacity-50 blur-sm" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                                <div className="rendering-card bg-white p-6 rounded-xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                                    <RefreshCcw className="spinner w-8 h-8 text-blue-600 animate-spin mb-4" />
                                    <span className="title font-bold text-gray-900 block mb-1">Rendering...</span>
                                    <span className="subtitle text-sm text-gray-500 block">Generating your 3D visualization</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compare Panel */}
                <div className="panel compare flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="panel-header flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="panel-meta">
                            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Comparison</p>
                            <h3 className="text-lg font-bold text-gray-900">Before and After</h3>
                        </div>
                        <div className="hint text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Drag to compare</div>
                    </div>

                    <div className="compare-stage flex-1 flex items-center justify-center bg-gray-100 p-4">
                        {project?.sourceImage && currentImage ? (
                            <ReactCompareSlider
                                className="rounded-lg overflow-hidden shadow-inner border border-gray-200"
                                defaultValue={50}
                                style={{ width: '100%', height: '100%', maxHeight: '600px' }}
                                itemOne={
                                    <ReactCompareSliderImage src={project.sourceImage} alt="before" className="object-cover" />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src={currentImage} alt="after" className="object-cover" />
                                }
                            />
                        ) : (
                            <div className="compare-fallback w-full h-full flex items-center justify-center text-gray-400">
                                {project?.sourceImage ? (
                                    <img src={project.sourceImage} alt="Before" className="max-w-full max-h-full object-contain opacity-50" />
                                ) : (
                                    <p>Loading comparison...</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VisualizerId;