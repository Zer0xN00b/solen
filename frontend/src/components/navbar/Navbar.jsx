// NOTE: currently unused - the homepage renders its navbar markup inline.
// Kept for a future shared navbar (Scope doc §42 final polish).
import '../../pages/home/HomePage.css';

function Navbar() {
  return (
    <nav className="navbar transparent">
      <div className="logo">
        <img src="/assets/solen-logo.png" alt="SOLEN Logo" />
      </div>
      <ul className="nav-links">
        <li><a href="#destinations">Destinations</a></li>
        <li><a href="#experiences">Experiences</a></li>
        <li><a href="#emotions">Plan a Journey</a></li>
        <li><a href="#planner">About</a></li>
      </ul>
      <button className="nav-cta">Start Planning</button>
    </nav>
  );
}

export default Navbar;
