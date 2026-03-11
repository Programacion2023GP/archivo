// import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState, type ChangeEvent, type EventHandler, type InputEventHandler } from "react";


// function App() {
//   return (
//     <>
  
//     </>
//   );
// }
// export interface CounterRef {
//   increment: () => void;
//   decrement: () => void;
//   reset: () => void;
// }

// interface CounterProps {
//   initialValue: number;
// }
// const CustomCount =forwardRef<CounterRef,CounterProps>(({initialValue},ref)=>{
//     const [count, setCount] = useState(initialValue);

//   useImperativeHandle(ref,()=>({
//      increment: () => setCount((prev) => prev + 1),
//     decrement: () => setCount((prev) => prev - 1),
//     reset: () => setCount(initialValue),
//   }),[])
//   return (<></>)
// })
// export default App
