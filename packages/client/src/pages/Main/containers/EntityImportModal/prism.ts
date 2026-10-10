import Prism from "prismjs";

// prismjs ships as CommonJS, and the bundler evaluates it lazily at the first
// import site. Its grammar files are plain scripts that expect a global Prism
// at module-evaluation time, so the core has to be imported from its own
// module that is loaded before any "prismjs/components/*" import.
export default Prism;
