import { HomeHeader } from './home/HomeHeader.jsx';
import { HomeHero } from './home/HomeHero.jsx';
import { HomeProjects } from './home/HomeProjects.jsx';
import { HomeSkills } from './home/HomeSkills.jsx';
import { HomeAbout } from './home/HomeAbout.jsx';
import { HomeContact } from './home/HomeContact.jsx';
import { HomeFooter } from './home/HomeFooter.jsx';

export function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="page-wrap portfolio-width" id="top">
        <HomeHeader />
        <main id="main" tabIndex={-1}>
          <HomeHero />
          <HomeProjects />
          <HomeSkills />
          <HomeAbout />
          <HomeContact />
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
