/* cspell:disable */
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Briefcase, Users, Building2, TrendingUp, CheckCircle2, Star, ChevronRight, Menu } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useI18n } from "../lib/i18n";

type Language = "fr" | "zarma" | "ha";

const content = {
  fr: {
    login: "Se connecter",
    startNow: "Commencer maintenant",
    forEveryoneTitle: "Une plateforme pour tous",
    forEveryoneDesc:
      "Que vous soyez un jeune a la recherche d'opportunites ou une entreprise avec des besoins ponctuels",
    youthTitle: "Pour les Jeunes",
    youthBullets: [
      "Parcourez des centaines de missions adaptees",
      "Postulez en un clic avec votre profil",
      "Construisez votre reputation professionnelle",
      "Gagnez de l'argent et de l'experience",
    ],
    youthCta: "Je suis un jeune",
    companyTitle: "Pour les Entreprises",
    companyBullets: [
      "Publiez vos besoins en quelques minutes",
      "Recevez des candidatures qualifiees",
      "Choisissez les meilleurs talents",
      "Evaluez et fidelisez vos travailleurs",
    ],
    companyCta: "Je suis une entreprise",
    stats: ["Jeunes inscrits", "Entreprises actives", "Missions realisees", "Satisfaction moyenne"],
    howItWorksTitle: "Comment ca marche ?",
    steps: [
      {
        title: "Inscrivez-vous",
        desc: "Creez votre compte en 2 minutes et completez votre profil",
      },
      {
        title: "Connectez-vous",
        desc: "Jeunes trouvent des missions, entreprises trouvent des talents",
      },
      {
        title: "Collaborez",
        desc: "Travaillez ensemble et evaluez-vous mutuellement",
      },
    ],
    ctaTitle: "Pret a commencer ?",
    ctaDesc:
      "Rejoignez Microjob aujourd'hui et connectez-vous aux opportunites qui vous correspondent",
    ctaButton: "S'inscrire gratuitement",
    footerTagline: "Connecter les jeunes nigeriens aux opportunites d'emploi",
    footerLinks: ["A propos", "Contact", "Conditions", "Confidentialite"],
    footerRights: "© 2026 Microjob. Tous droits reserves.",
    footerMadeFor: "Developpe avec coeur pour les jeunes nigeriens",
    slides: [
      {
        title: "Trouvez des micro-emplois pres de chez vous",
        description: "Des milliers d'opportunites pour les nigeriens",
      },
      {
        title: "Postulez en un clic",
        description: "Interface simple et rapide pour candidater aux missions qui vous interessent",
      },
      {
        title: "Construisez votre reputation",
        description: "Systeme d'evaluation transparent pour valoriser votre travail",
      },
    ],
  },
  zarma: {
    login: "Huru",
    startNow: "Sintin sohoy",
    forEveryoneTitle: "Dandali i ga boro kulu se",
    forEveryoneDesc:
      "Nda ni ga baa goyo foo wala kompani ga baa sahay kayna, i ga no ne",
    youthTitle: "Zankey se",
    youthBullets: [
      "Guna goyo kayna boobo nda ni ganda",
      "Naafal nda clic foo nda ni profil",
      "Tiji ni maayey goyo ra",
      "Du nooru nda hima",
    ],
    youthCta: "Ay ga zanka",
    companyTitle: "Kompaniyey se",
    companyBullets: [
      "Cebandi ni ga baa ra carey ra",
      "Du naafaley himante",
      "Suuba boro beeriya",
      "Kimandi nda gaabi ni goyokoyey",
    ],
    companyCta: "Ay ga kompani",
    stats: ["Zankey ga huru", "Kompaniyey ga goyo", "Goyey timme", "Farhanya hima"],
    howItWorksTitle: "I ga tee mate ?",
    steps: [
      {
        title: "Huru",
        desc: "Te ni compte ra miniti hinka ra nda timandi ni profil",
      },
      {
        title: "Sambay",
        desc: "Zankey ga du goy, kompaniyey ga du boro beeri",
      },
      {
        title: "Goyo care banda",
        desc: "Wa goyo care banda nda wa himandi care",
      },
    ],
    ctaTitle: "Ni sirya sintin se ?",
    ctaDesc: "Huru Microjob handu nda ni ma sintin nda goyey kaanante ni se",
    ctaButton: "Huru bila nda banandi nooru",
    footerTagline: "Ceeci zankey nigeriya goyo dammey se",
    footerLinks: ["I ga ne", "Sooji", "Sharayi", "Sirriya"],
    footerRights: "© 2026 Microjob. Hakku kulu goy.",
    footerMadeFor: "Te bande ga ba zankey nigeriya",
    slides: [
      {
        title: "Du micro-goyo ni nungu ra",
        description: "Dame boobo nigeriya borey se",
      },
      {
        title: "Naafal nda clic foo",
        description: "Fondo faala nda hanzari, ka ni naafal goyey se",
      },
      {
        title: "Tiji ni maayey",
        description: "Himandi fondo bayante ni goyo se",
      },
    ],
  },
  ha: {
    login: "Shiga",
    startNow: "Fara yanzu",
    forEveryoneTitle: "Dandali ga kowa",
    forEveryoneDesc:
      "Ko kai matashi ne ko kamfani mai bukatar ma'aikata na lokaci kadan, an tanada maka",
    youthTitle: "Ga Matasa",
    youthBullets: [
      "Bincika ayyuka da dama kusa da kai",
      "Aika nema da danna daya tare da bayananka",
      "Gina martabarka ta aiki",
      "Samu kudi da kwarewa",
    ],
    youthCta: "Ni matashi ne",
    companyTitle: "Ga Kamfanoni",
    companyBullets: [
      "Sanya bukatunka cikin mintuna kadan",
      "Karbi ingantattun masu nema",
      "Zabi kwararrun matasa",
      "Kimanta kuma ka rike ma'aikata",
    ],
    companyCta: "Ni kamfani ne",
    stats: ["Matasa masu rijista", "Kamfanoni masu aiki", "Ayyuka da aka kammala", "Matsakaicin gamsuwa"],
    howItWorksTitle: "Yaya yake aiki?",
    steps: [
      {
        title: "Yi rajista",
        desc: "Kirkiro asusunka cikin mintuna 2 kuma ka cika bayananka",
      },
      {
        title: "Haɗa kai",
        desc: "Matasa su samu aiki, kamfanoni su samu kwararru",
      },
      {
        title: "Yi aiki tare",
        desc: "Ku yi aiki tare sannan ku kimanta juna",
      },
    ],
    ctaTitle: "Ka shirya farawa?",
    ctaDesc: "Shiga Microjob yau ka hada kai da damarmaki da suka dace da kai",
    ctaButton: "Yi rajista kyauta",
    footerTagline: "Hada matasan Nijar da damar aiki",
    footerLinks: ["Game da mu", "Tuntube mu", "Sharudda", "Sirri"],
    footerRights: "© 2026 Microjob. An kiyaye dukkan hakkoki.",
    footerMadeFor: "An gina shi da kauna ga matasan Nijar",
    slides: [
      {
        title: "Nemo kananan ayyuka kusa da kai",
        description: "Dubban damarmaki ga 'yan Nijar",
      },
      {
        title: "Aika nema da danna daya",
        description: "Sauki da sauri wajen neman ayyukan da kake so",
      },
      {
        title: "Gina martabarka",
        description: "Tsarin kimantawa a bayyane don nuna aikin ka",
      },
    ],
  },
};

export function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language } = useI18n();
  const t = content[language];

  const slides = [
    {
      title: t.slides[0].title,
      description: t.slides[0].description,
      image: "https://images.unsplash.com/photo-1717934444759-41d4794edcca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFmcmljYW4lMjBwZW9wbGUlMjB3b3JraW5nJTIwc21hcnRwaG9uZXxlbnwxfHx8fDE3NzE4NTE3ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      color: "from-indigo-600 to-indigo-700"
    },
    {
      title: t.slides[1].title,
      description: t.slides[1].description,
      image: "https://images.unsplash.com/photo-1734255026082-82fdc81991f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYnVzaW5lc3MlMjBvcHBvcnR1bml0eXxlbnwxfHx8fDE3NzE4NTE3ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      color: "from-green-600 to-green-700"
    },
    {
      title: t.slides[2].title,
      description: t.slides[2].description,
      image: "https://images.unsplash.com/photo-1717934444759-41d4794edcca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFmcmljYW4lMjBwZW9wbGUlMjB3b3JraW5nJTIwc21hcnRwaG9uZXxlbnwxfHx8fDE3NzE4NTE3ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      color: "from-orange-600 to-orange-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
              <Briefcase className="size-6 text-white" />
            </div>
            <span className="font-bold text-xl">Microjob</span>
          </div>
          <Link to="/login">
            <Button className="bg-indigo-600 hover:bg-indigo-700">{t.login}</Button>
          </Link>
        </div>
      </header>

      {/* Hero Slider */}
      <section className="relative h-[600px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.color}`}>
              <div className="absolute inset-0 bg-black/20" />
              <ImageWithFallback
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
              />
            </div>
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="max-w-2xl text-white">
                <h1 className="text-5xl font-bold mb-4">{slide.title}</h1>
                <p className="text-xl mb-8 text-white/90">{slide.description}</p>
                <Link to="/login">
                  <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100">
                    {t.startNow}
                    <ChevronRight className="size-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Slider dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Aller a la diapositive ${index + 1}`}
              title={`Aller a la diapositive ${index + 1}`}
              onClick={() => setCurrentSlide(index)}
              className={`size-2.5 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-8" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Fonctionnalités principales */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t.forEveryoneTitle}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t.forEveryoneDesc}
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Carte Jeunes */}
            <Card className="border-2 border-indigo-200 hover:border-indigo-400 transition-colors overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-indigo-600 to-indigo-700" />
              <CardContent className="p-8">
                <div className="size-14 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                  <Users className="size-7 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.youthTitle}</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.youthBullets[0]}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.youthBullets[1]}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.youthBullets[2]}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.youthBullets[3]}</span>
                  </li>
                </ul>
                <Link to="/login">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 group-hover:shadow-lg transition-shadow">
                    {t.youthCta}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Carte Entreprises */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-green-600 to-green-700" />
              <CardContent className="p-8">
                <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <Building2 className="size-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.companyTitle}</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.companyBullets[0]}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.companyBullets[1]}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.companyBullets[2]}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{t.companyBullets[3]}</span>
                  </li>
                </ul>
                <Link to="/login">
                  <Button className="w-full bg-green-600 hover:bg-green-700 group-hover:shadow-lg transition-shadow">
                    {t.companyCta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-700 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-indigo-100">{t.stats[0]}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">150+</div>
              <div className="text-indigo-100">{t.stats[1]}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1200+</div>
              <div className="text-indigo-100">{t.stats[2]}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.7/5</div>
              <div className="text-indigo-100">{t.stats[3]}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t.howItWorksTitle}</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="size-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">1</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t.steps[0].title}</h3>
                <p className="text-sm text-gray-600">
                  {t.steps[0].desc}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t.steps[1].title}</h3>
                <p className="text-sm text-gray-600">
                  {t.steps[1].desc}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="size-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600">3</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t.steps[2].title}</h3>
                <p className="text-sm text-gray-600">
                  {t.steps[2].desc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            {t.ctaDesc}
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100">
              {t.ctaButton}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
                <Briefcase className="size-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Microjob</span>
            </div>
            <p className="text-center max-w-md">
              {t.footerTagline}
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/" className="hover:text-white transition-colors">{t.footerLinks[0]}</Link>
              <Link to="/" className="hover:text-white transition-colors">{t.footerLinks[1]}</Link>
              <Link to="/" className="hover:text-white transition-colors">{t.footerLinks[2]}</Link>
              <Link to="/" className="hover:text-white transition-colors">{t.footerLinks[3]}</Link>
            </div>
            <div className="text-xs text-gray-500 text-center">
              <p>{t.footerRights}</p>
              <p className="mt-1">{t.footerMadeFor}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
