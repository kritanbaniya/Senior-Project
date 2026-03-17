import { Link } from 'react-router-dom'
import { Mail, Phone, Clock, ChevronDown, HelpCircle, Home } from 'lucide-react'

export default function Support() {
  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Click \"Forgot password?\" on the login page and follow the instructions sent to your email."
    },
    {
      question: "How do I schedule an appointment?",
      answer: "Log in to your patient portal and navigate to the \"Upcoming Appointments\" section and select \"Book Appointment\"."
    },
    {
      question: "Is my health data secure?",
      answer: "Yes. ClinicIQ uses encryption and follows HIPAA guidelines to protect your information."
    },
    {
      question: "How do I update my personal information?",
      answer: "Log in to your account, navigate to \"Your Information\" from the dashboard, and update your details. Don't forget to click \"Save\" when you're done."
    },
    {
      question: "Where can I complete my forms?",
      answer: "Intake and consent forms can be found at the bottom of the patient dashboard in the \"Digital intake & consent\" section."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-16 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <HelpCircle className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            How can we help?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Review common questions below or connect with our support specialists for further assistance.
          </p>
        </div>

        {/* FAQ Section - Glassmorphism touch */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Common Questions</h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          
          <div className="grid gap-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-blue-300 hover:shadow-md">
                <summary className="flex items-center justify-between cursor-pointer p-5 list-none">
                  <h3 className="font-semibold text-slate-800 pr-4">{faq.question}</h3>
                  <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-300 group-open:rotate-180 flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Contact Section - 3-Column Grid */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl overflow-hidden relative">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-950 rounded-full blur-3xl -ml-32 -mb-32 opacity-30"></div>
          
          <div className="relative z-10 text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Still have questions?</h2>
            <p className="text-blue-100">Our team is available for technical and administrative support.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-700/50 hover:bg-blue-700/50 transition-colors">
                <Mail className="w-6 h-6 text-blue-200" />
              </div>
              <p className="font-bold text-lg mb-1">Email Us</p>
              <p className="text-sm text-blue-200">support@cliniciq.com</p>
            </div>

            <div className="text-center p-4 border-y md:border-y-0 md:border-x border-blue-700/30">
              <div className="w-12 h-12 bg-blue-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-700/50 hover:bg-blue-700/50 transition-colors">
                <Phone className="w-6 h-6 text-blue-200" />
              </div>
              <p className="font-bold text-lg mb-1">Call Us</p>
              <p className="text-sm text-blue-200">(555) 123-4567</p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-700/50 hover:bg-blue-700/50 transition-colors">
                <Clock className="w-6 h-6 text-blue-200" />
              </div>
              <p className="font-bold text-lg mb-1">Availability</p>
              <p className="text-sm text-blue-200">Mon-Fri, 9am-5pm EST</p>
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="relative z-10 text-center mt-10">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}