import React from 'react'

function Chats(props) {
  // console.log("Image:", props.img); // Log the correct prop
  return (
    <div className="flex items-center gap-2">

      <img
        src={props.img}
     
        className="rounded-full w-14 h-14 object-cover"
      />
      <div className="flex flex-col">
        <h2 className="text-white text-lg">{props.name}</h2>
        <h4 className="text-white text-sm font-light self-start">{props.last}</h4>
      </div>
    </div>
  )
}

export default Chats;
