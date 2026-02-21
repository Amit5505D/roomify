import { useNavigate, useOutletContext, useParams, useLocation } from "react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, Share2, X, Sparkles } from "lucide-react";
import Button from "../../components/ui/Button";
import { createProject, getProjectById } from "../../lib/puter.action";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

type AuthContext = { userId?: string };

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useOutletContext<AuthContext>();

    // 1. UPDATED: Added 'style?: string' to the expected state
    const navState = location.state as { initialImage?: string; initialRendered?: string; name?: string; style?: string } | null;
    const hasInitialGenerated = useRef(false);

    // -- State Management --
    const [isMounted, setIsMounted] = useState(false);
    const [isProjectLoading, setIsProjectLoading] = useState(!navState);
    const [isProcessing, setIsProcessing] = useState(false);

    // 2. UPDATED: Catch the style in our project state
    const [project, setProject] = useState<any | null>(navState ? {
        id,
        name: navState.name,
        sourceImage: navState.initialImage,
        renderedImage: navState.initialRendered,
        style: navState.style
    } : null);

    const [currentImage, setCurrentImage] = useState<string | null>(navState?.initialRendered || null);

    // -- Handlers --
    const handleBack = () => navigate('/');

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
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Failed to download image:", error);
        }
    };

    const runGeneration = useCallback(async (item: any) => {
        if (!id || !item.sourceImage) return;
        try {
            setIsProcessing(true);

            // 3. UPDATED: Pass the style to the AI generator!
            const result = await generate3DView({
                sourceImage: item.sourceImage,
                style: item.style
            });

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

                const saved = await createProject({ item: updatedItem, visibility: "private" });
                if (saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        } catch (error) {
            console.error('Generation failed: ', error);
            hasInitialGenerated.current = false;
        } finally {
            setIsProcessing(false);
        }
    }, [id, userId]);

    // -- Effects --
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        let isMountedFlag = true;
        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }
            if (!project?.sourceImage) {
                setIsProjectLoading(true);
                const fetchedProject = await getProjectById({ id });
                if (!isMountedFlag) return;

                if (fetchedProject) {
                    setProject(fetchedProject);
                    setCurrentImage(fetchedProject.renderedImage || null);
                }
                setIsProjectLoading(false);
            }
        };
        loadProject();
        return () => { isMountedFlag = false; };
    }, [id, project?.sourceImage]);

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

    // -- Render --
    return (
        <div className="visualizer min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
            {/* Premium Glassmorphism Navbar */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div className="brand flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-gray-900 to-gray-800 shadow-md">
                        <Box className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-gray-900">Roomify<span className="text-orange-500">.</span></span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
                    <X className="w-4 h-4 mr-2" /> Close Editor
                </Button>
            </nav>

            {/* Main Studio Area */}
            <section className="flex-1 p-6 md:p-10 grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1800px] mx-auto w-full">

                {/* Panel 1: Render Stage */}
                <div className="flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <div className="flex justify-between items-center p-6 border-b border-gray-50/80">
                        <div>
                            <p className="text-[11px] font-bold tracking-widest text-orange-500 uppercase mb-1">Canvas</p>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{project?.name || `Project ${id?.substring(0, 6)}`}</h2>
                        </div>
                        <div className="flex gap-3">
                            <Button size="sm" onClick={handleExport} disabled={!currentImage || isProcessing} className="rounded-full bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm transition-all px-4">
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size="sm" className="rounded-full bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg transition-all px-5">
                                <Share2 className="w-4 h-4 mr-2" /> Share
                            </Button>
                        </div>
                    </div>

                    <div className={`relative flex-1 min-h-[500px] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-gray-50 flex items-center justify-center overflow-hidden`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="w-full h-full object-cover animate-in fade-in duration-700" />
                        ) : (
                            <div className="w-full h-full p-8 flex items-center justify-center">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original" className="max-w-full max-h-full object-contain opacity-40 blur-md scale-95" />
                                )}
                            </div>
                        )}

                        {/* Premium Loading Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl flex items-center justify-center z-10 transition-all duration-500">
                                <div className="bg-white/90 p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white flex flex-col items-center text-center max-w-sm">
                                    <div className="relative flex items-center justify-center w-16 h-16 mb-6">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-orange-500 animate-spin"></div>
                                        <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                                    </div>
                                    <span className="font-extrabold text-xl text-gray-900 block mb-2 tracking-tight">AI is dreaming...</span>
                                    {/* 4. UPDATED: Show the user their selected style while it loads! */}
                                    <span className="text-sm text-gray-500 block leading-relaxed">Applying your <b className="text-gray-900">{project?.style || 'chosen'}</b> aesthetic to the geometry. This usually takes a few seconds.</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel 2: Comparison Tool */}
                <div className="flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-50/80">
                        <div>
                            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">Analysis</p>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Before & After</h3>
                        </div>
                        <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                            Interactive View
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
                        {isMounted && project?.sourceImage && currentImage ? (
                            <div className="w-full h-full max-h-[700px] rounded-2xl overflow-hidden shadow-lg border border-gray-200/60 ring-1 ring-black/5">
                                <ReactCompareSlider
                                    defaultValue={50}
                                    style={{ width: '100%', height: '100%' }}
                                    itemOne={<ReactCompareSliderImage src={project.sourceImage} alt="before" className="object-cover" />}
                                    itemTwo={<ReactCompareSliderImage src={currentImage} alt="after" className="object-cover" />}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                {project?.sourceImage ? (
                                    <img src={project.sourceImage} alt="Before" className="max-w-[70%] max-h-[70%] object-contain opacity-30 rounded-xl" />
                                ) : (
                                    <p className="text-sm font-medium">Awaiting render comparison...</p>
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