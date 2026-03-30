import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import { EditorProvider } from './lib/editorContext';
import { TemplateLibraryProvider } from './lib/templates/context';
import EditorPage from './pages/EditorPage';
import TemplatesPage from './pages/TemplatesPage';

export default function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <TemplateLibraryProvider>
                <EditorProvider>
                    <div className="flex flex-col h-screen overflow-hidden antialiased bg-paper">
                        <Header />
                        <Routes>
                            <Route path="/" element={<EditorPage />} />
                            <Route path="/templates" element={<TemplatesPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </EditorProvider>
            </TemplateLibraryProvider>
        </BrowserRouter>
    );
}
