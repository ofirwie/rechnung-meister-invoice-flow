// At the very top of the file, after imports:
const DEBUG_MODE = true;
let calcCount = 0;

// In calculateTotals function, at the beginning:
calcCount++;
console.log(`🔴 calculateTotals called ${calcCount} times`);

// Right after the title in the JSX:
{DEBUG_MODE && (
  <div style={{
    position: 'fixed',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: calcCount > 5 ? 'red' : 'orange',
    color: 'white',
    padding: '20px',
    borderRadius: '10px',
    fontSize: '24px',
    fontWeight: 'bold',
    zIndex: 9999,
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  }}>
    📊 CALC COUNT: {calcCount}
    {calcCount > 5 && ' - INFINITE LOOP\!'}
  </div>
)}
