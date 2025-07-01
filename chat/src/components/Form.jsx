import React, { useRef, useState } from 'react';
import emailjs from 'emailjs-com';

function Form() {
  const formRef = useRef();
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState(null);

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSent(false);
    setError(null);

    emailjs.sendForm(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      formRef.current,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )
    .then((result) => {
      console.log(result.text);
      setIsSent(true);
      formRef.current.reset();
    }, (err) => {
      console.error(err.text);
      setError('Failed to send. Try again.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center py-12 px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-4xl w-full flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-1/2">
          <img
            src="https://imgs.search.brave.com/Zb8a7jCTgnwAwCgw4Ss4EvsgrQvk-U4-2YfqXTtgoL0/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9mdC5z/eW5jZnVzaW9uLmNv/bS9mZWF0dXJldG91/ci9yZWFjdC1qczIv/aW1hZ2VzL2NoYXQt/dWkvcmVhY3QtY2hh/dHVpLWVtcHR5LXRl/bXBsYXRlLnBuZw"
            alt="Chat Visual"
            className="rounded-2xl object-cover w-full h-full"
          />
        </div>

        <div className="w-full md:w-1/2">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Drop a Message 🚀</h2>
          <form ref={formRef} onSubmit={sendEmail} className="flex flex-col gap-4">
            <input name="name" required placeholder="Your Name"
              className="p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input name="phone" required placeholder="Phone Number" type="number"
              className="p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input name="email" required placeholder="Email Address" type="email"
              className="p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <textarea name="message" required placeholder="Your Message"
              className="p-3 h-32 rounded-xl border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>

            <button type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 rounded-xl hover:opacity-90 transition">
              Send Message
            </button>

            {isSent && <p className="text-green-600 font-medium mt-2">✅ Message sent successfully!</p>}
            {error && <p className="text-red-600 font-medium mt-2">❌ {error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Form;
