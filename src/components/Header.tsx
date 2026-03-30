import { Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `pill-item ${isActive ? 'pill-item-active' : ''}`;

export default function Header() {
  return (
    <header className="relative flex items-center justify-between px-5 h-12 bg-surface border-b border-rule shrink-0 z-[100]">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt="SNS Publish logo"
          className="h-[26px] w-[26px] shrink-0 rounded-[5px]"
        />
        <span className="font-display text-base font-semibold tracking-tight text-ink">
          SNS Publish
        </span>
      </div>

      {/* Center: Navigation (absolute center) */}
      <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="pill-group">
          <NavLink to="/" end className={navClassName}>
            文档编辑
          </NavLink>
          <NavLink to="/templates" className={navClassName}>
            模板制作
          </NavLink>
        </div>
      </nav>

      {/* Right: GitHub */}
      <div className="shrink-0">
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://github.com/AntiEris/SNS-publish"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn-sm"
        >
          <Github size={16} />
        </motion.a>
      </div>
    </header>
  );
}
