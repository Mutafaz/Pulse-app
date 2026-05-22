"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './MuscleSelector.module.css';

export default function MuscleSelector({ 
  mode = 'interactive', // 'interactive' or 'heatmap'
  gender = 'male',
  side = 'front',
  selectedMuscle = null, 
  onSelectMuscle = () => {},
  muscleLoads = {} // { chest: 80, quads: 20, ... }
}) {
  const [svgContent, setSvgContent] = useState('');
  const containerRef = useRef(null);

  // Fetch the SVG file when gender/side changes
  useEffect(() => {
    const fetchSvg = async () => {
      const fileName = `/musclemap_${gender === 'female' ? 'female_' : ''}${side}.svg`;
      try {
        const res = await fetch(fileName);
        if (res.ok) {
          const text = await res.text();
          setSvgContent(text);
        } else {
          console.error("Failed to load SVG:", fileName);
        }
      } catch (err) {
        console.error("Error loading SVG:", err);
      }
    };
    fetchSvg();
  }, [gender, side]);

  // After SVG is injected: apply load classes / selected state
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    // Apply load / selected classes to bodymap groups
    const gElements = svgEl.querySelectorAll('g.bodymap');
    gElements.forEach(g => {
      g.classList.remove('selected', 'loadLow', 'loadMedLow', 'loadMed', 'loadHigh');

      const id = g.id;
      if (!id) return;

      if (mode === 'interactive') {
        if (selectedMuscle && id === selectedMuscle) {
          g.classList.add('selected');
        }
      } else if (mode === 'heatmap') {
        const score = muscleLoads[id] || 0;
        if (score >= 75) {
          g.classList.add('loadHigh');
        } else if (score >= 50) {
          g.classList.add('loadMed');
        } else if (score >= 25) {
          g.classList.add('loadMedLow');
        } else if (score > 0) {
          g.classList.add('loadLow');
        }
      }
    });

  }, [svgContent, mode, selectedMuscle, muscleLoads]);

  // Intercept clicks on the SVG
  const handleSvgClick = (e) => {
    if (mode !== 'interactive') return;
    const gNode = e.target.closest('g.bodymap');
    if (gNode && gNode.id) {
      onSelectMuscle(gNode.id);
    }
  };

  return (
    <div className={styles.container}>
      {/* SVG Container */}
      <div 
        ref={containerRef}
        className={`${styles.svgContainer} ${mode === 'interactive' ? styles.modeInteractive : styles.modeHeatmap}`}
        onClick={handleSvgClick}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}
