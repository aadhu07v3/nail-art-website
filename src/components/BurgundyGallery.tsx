import almondImg from '../../images/shapes/almond.png';
import ovalImg from '../../images/shapes/oval.png';
import roundImg from '../../images/shapes/round.png';
import squareImg from '../../images/shapes/square.png';
import squovalImg from '../../images/shapes/squoval.png';
import coffinImg from '../../images/shapes/coffin.png';
import stilettoImg from '../../images/shapes/stiletto.png';
import flareImg from '../../images/shapes/flare.png';

interface ProjectItem {
  id: number;
  year: string;
  title: string;
  image: string;
}

const projects: ProjectItem[] = [
  { id: 1, year: '2026', title: 'ALMOND', image: almondImg },
  { id: 2, year: '2026', title: 'OVAL', image: ovalImg },
  { id: 3, year: '2026', title: 'ROUND', image: roundImg },
  { id: 4, year: '2026', title: 'SQUARE', image: squareImg },
  { id: 5, year: '2026', title: 'SQUOVAL', image: squovalImg },
  { id: 6, year: '2026', title: 'COFFIN', image: coffinImg },
  { id: 7, year: '2026', title: 'STILETTO', image: stilettoImg },
  { id: 8, year: '2026', title: 'FLARE', image: flareImg },
];

export default function BurgundyGallery() {
  return (
    <section className="relative w-full bg-transparent py-16 select-none">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-6 sm:grid-cols-3 lg:grid-cols-4">
        {projects.map((item) => (
          <div key={item.id} className="group flex flex-col gap-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#f5e6d3]/15 bg-[#380513]">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bordeaux-noir)]/60 via-transparent to-transparent" />
            </div>
            <div className="flex items-center justify-between px-1 text-xs tracking-[0.18em] text-[#f5e6d3]/80">
              <span>{item.year}</span>
              <span className="font-medium text-[#f5e6d3]">{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
