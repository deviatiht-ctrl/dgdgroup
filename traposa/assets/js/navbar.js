// TRAPOSA Navbar Functionality

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  initScrollEffects();
  initLanguageSwitcher();
  lucide.createIcons();
});

// Navbar initialization
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const menuToggle = document.querySelector('.menu-toggle');
  const navbarNav = document.querySelector('.navbar-nav');

  if (!navbar) return;

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (menuToggle && navbarNav) {
    menuToggle.addEventListener('click', () => {
      navbarNav.classList.toggle('open');
      menuToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        navbarNav.classList.remove('open');
        menuToggle.classList.remove('active');
      }
    });

    // Close menu when clicking a link
    navbarNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navbarNav.classList.remove('open');
        menuToggle.classList.remove('active');
      });
    });
  }

  // Set active nav item based on current page
  const currentPage = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPage.includes(href.replace('../', '').replace('./', ''))) {
      link.classList.add('active');
    }
  });
}

// Mobile bottom navigation
function initMobileNav() {
  const mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) return;

  const currentPage = window.location.pathname;
  
  mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href && currentPage.includes(href.replace('../', '').replace('./', ''))) {
      item.classList.add('active');
    }
  });
}

// Scroll effects
function initScrollEffects() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offset = 100;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

// Language switcher
function initLanguageSwitcher() {
  const langButtons = document.querySelectorAll('.lang-btn');
  const currentLang = localStorage.getItem('traposa-lang') || 'FR';

  langButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem('traposa-lang', lang);
      langButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTranslations(lang);
      document.dispatchEvent(new CustomEvent('languageChange', { detail: { lang } }));
    });
  });

  applyTranslations(currentLang);
}

// Apply translations to current page
function applyTranslations(lang) {
  const t = translations[lang] || translations['HT'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = t[el.dataset.i18nHtml];
    if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const v = t[el.dataset.i18nPlaceholder];
    if (v !== undefined) el.placeholder = v;
  });
  document.documentElement.lang = lang === 'HT' ? 'ht' : lang === 'FR' ? 'fr' : 'en';
}

// Full translations — HT (Kreyo`l) | FR (Français) | EN (English)
const translations = {
  HT: {
    nav_home:'Akèy', nav_mission:'Misyon', nav_projects:'Projè', nav_news:'Aktualite',
    nav_team:'Ekip', nav_partners:'Partenè', nav_contact:'Kontakte', nav_donate:'Fe Yon Don',
    hero_eyebrow:'TRAPOSA — Òganizasyon Sosyal Ayisyen',
    hero_title_html:'<span class="highlight-green">TRANSFORMER</span> pour Sauver',
    hero_desc:'TRAPOSA se yon òganizasyon sosyal ki aktif ann Ayiti. Misyon prensipal li se ede timoun vilnerab yo amelyore kondisyon lavi yo, espesyalman nan edikasyon ak asistans sosyal.',
    hero_btn_projects:'Wè Projè Nou Yo', hero_btn_donate:'Fe Yon Don',
    hero_stat_beneficiaires:'Benefisiè', hero_stat_projets:'Projè Aktif', hero_stat_benevoles:'Bénévòl', hero_stat_depatman:'Depatman',
    mission_title:'Misyon Nou', mission_subtitle:'Twa pilye fondamantal ki gide tout aksyon nou yo pou yon Ayiti miyò',
    mission_p1_title:'Edike', mission_p1_desc:'Nou fasilite aksè a edikasyon pou timoun ki nan difikilte. Edikasyon se kle pou soti nan povrete epi konstwi yon demen miyò.',
    mission_p2_title:'Sipòte', mission_p2_desc:'Nou founi sipò debaz pou timoun vilnerab: manje, rad, ak founiti lekòl ki nesesè pou yo ka aprann.',
    mission_p3_title:'Pwoteje', mission_p3_desc:'Nou pwoteje timoun kont povrete ak eksklizyon. Nou ede jèn yo soti nan sèk povrete a epi konstwi yon demen miyò.',
    projects_title:'Projè Aktif', projects_subtitle:'Dekouvri kijan nou ap ede timoun vilnerab nan tout peyi a',
    filter_all:'Tout', filter_education:'Edikasyon', filter_sante:'Sante', filter_agri:'Agrikilti', filter_env:'Anviwonman', filter_ijans:'Ijans',
    proj1_title:'Restriktirasyion Lekòl Nasyonal Bè-de-En', proj1_loc:'Bè-de-En, Nòdwès', proj1_raised:'G700,000', proj1_goal:'sou G1,000,000',
    proj2_title:'Sipò Timoun Vilnerab — Nòdwès', proj2_loc:'Depatman Nòdwès', proj2_raised:'G180,000', proj2_goal:'sou G300,000',
    proj3_title:'Pwogram Edikasyon Pou Tout', proj3_loc:'Plizyè Depatman, Ayiti', proj3_raised:'G85,000', proj3_goal:'sou G200,000',
    projects_btn_all:'Tout Projè',
    impact_title:'Enpak Nou', impact_subtitle:'Chif ki pale pou tèt yo — rezilta aksyon kolèktif nou yo',
    impact_beneficiaires:'Benefisiè Dirèk', impact_projets:'Projè Aktif', impact_years:'Zan Travay', impact_communes:'Komin Enplike',
    news_title:'Aktualite Resan', news_subtitle:'Rete enfòme sou dènye nouvèl ak rezilta nou yo',
    news1_badge:'Siksè', news1_date:'2 jou pase', news1_title:'Lekòl nasyonal Bè-de-En restriktire grasa TRAPOSA', news1_excerpt:'TRAPOSA reyisi restriktire lekòl nasyonal Bè-de-En nan depatman Nòdwès, ki bay plis timoun aksè a edikasyon.',
    news2_badge:'Pwogram', news2_date:'1 semèn pase', news2_title:'Plis pase 10,000 timoun benefisye pwogram TRAPOSA an', news2_excerpt:'Depi 2022-2023, TRAPOSA rive ede plis pase 10,000 timoun vilnerab nan plizyè depatman Ayiti.',
    news3_badge:'Don', news3_date:'2 semèn pase', news3_title:'Djina Guillet Delatour apiye TRAPOSA ak don espesyal', news3_excerpt:'Otè Djina Guillet Delatour voye yon pati nan resèt liv li bay TRAPOSA pou soutni timoun ki nan bezwen.',
    news_btn_all:'Tout Aktualite',
    donate_cta_title:'Yon Timoun nan Bezwen. Ou Ka Ede.', donate_cta_desc:'Chak don kontribye pou bay espwa ak chanje lavi timoun vilnerab yo nan Ayiti.',
    donate_cta_btn:'Fe Yon Don Kounye a', donate_security:'Pèman Sekirè | Pwoteksyon Done | Rekib 100%',
    partners_title:'Partenè Nou Yo', partners_subtitle:'Nou kolabore ak òganizasyon ki pataje vizyon nou pou yon Ayiti miyò', partners_btn:'Vin Partenè Nou',
    volunteer_eyebrow:'Vin Bénévòl', volunteer_title:'Mete Konpetans Ou nan Sèvis Timoun Yo',
    volunteer_desc:'Rejwenn yon ekip pasyone ki dedye pou ede timoun vilnerab nan Ayiti. Chak talan gen valè — ann ansanm kreye chanjman.',
    vol_b1:'Fòmasyon pwofesyonèl gratis', vol_b2:'Rezo entènasyonal nan sektè imanitè a', vol_b3:'Sètifika rekonesans', vol_b4:'Eksperyans ki chanje lavi',
    vol_form_title:'Enskri Kounye a', vol_name:'Non Konplè *', vol_email:'Imèl *', vol_skills:'Konpetans', vol_submit:'Soumèt Demann lan',
    footer_desc:'Òganizasyon sosyal ayisyen ki angaje pou ede timoun vilnerab nan Ayiti grasa edikasyon ak asistans sosyal.',
    footer_newsletter:'Abònman Bilten Nou an', footer_subscribe:'Abòne', footer_quick_links:'Lyen Rapid',
    footer_contact_title:'Kontakte', footer_social_title:'Rezo Sosyal',
    footer_copyright:'© 2025 TRAPOSA. Tout dwa rezève.', footer_tagline:'🇭🇹 Fèt pou Ayiti',
    mission_page_title:'Misyon Nou', mission_page_subtitle:'Twa pilye fondamantal ki gide tout aksyon nou yo pou yon Ayiti miyò',
    mission_pp1_title:'1. Edike', mission_pp1_desc:'Nou fasilite aksè a edikasyon pou timoun ki nan difikilte. Nou kwè edikasyon se kle debaz pou kreye chanjman dirab nan lavi timoun yo.',
    mission_pp2_title:'2. Sipòte', mission_pp2_desc:'Nou bay sipò debaz: manje, rad, ak founiti lekòl. Lè timoun gen sa yo bezwen, yo ka konsantre sou aprann.',
    mission_pp3_title:'3. Pwoteje', mission_pp3_desc:'Nou pwoteje timoun vilnerab kont eksklizyon ak povrete. Nou ede jèn yo konstwi yon avni miyò pou tèt yo ak kominote yo.',
    mission_values_title:'Valè Nou Yo',
    val_solidarity:'Solidarite', val_solidarity_desc:'Nou kwè nan pouvwa ansanm pou rezoud pwoblèm kominote nou yo.',
    val_transparency:'Transparans', val_transparency_desc:'Nou angaje pou rann kont sou chak goud nou depanse ak chak aksyon nou pran.',
    val_inclusion:'Inklizyon', val_inclusion_desc:'Nou sèvi tout timoun san distenksyon, espesyalman moun ki pi vilnerab yo.',
    val_efficiency:'Efikasite', val_efficiency_desc:'Nou maksimize enpak chak resous atravè jesyon pwofesyonèl ak inovasyon.',
    mission_history_title:'Istwa Nou',
    mission_history_desc:'TRAPOSA se yon òganizasyon ki angaje pou pwoteksyon timoun, edikasyon, ak lit kont povrete ann Ayiti. Pwogram nou an kòmanse ak anviwon 10,000 timoun (2022–2023) epi elaji a plis pase 10,000 benefisiè ane kap vini an. Youn nan pwojè enpòtan nou yo se restriktirasyion lekòl nasyonal Bè-de-En nan depatman Nòdwès. Objektif nou se rive jwenn plis timoun toujou nan tout peyi a.',
    mission_history_btn:'Li Plis sou Pwogram Nou Yo',
    projects_page_title:'Projè Nou Yo', projects_page_subtitle:'Dekouvri kijan nou ap ede timoun vilnerab nan tout peyi a atravè pwogram dirab nou yo.',
    projects_loading:'Chajman projè yo...', projects_search_ph:'Chache projè...', projects_sort_label:'Triye:',
    sort_newest:'Pi resan', sort_goal_high:'Pi gwo objektif', sort_goal_low:'Pi piti objektif',
    news_page_title:'Aktualite', news_page_subtitle:'Rete enfòme sou dènye nouvèl ak rezilta nou yo.',
    news_pg1_title:'Lekòl nasyonal Bè-de-En restriktire grasa TRAPOSA',
    news_pg2_title:'Plis pase 10,000 timoun benefisye pwogram TRAPOSA an',
    news_pg3_title:'Djina Guillet Delatour apiye TRAPOSA ak don espesyal',
    contact_page_title:'Kontakte Nou', contact_page_subtitle:'Nou vle tande ou. Voye yon mesaj bay ekip nou an.',
    contact_info_title:'Enfòmasyon Kontak', contact_address:'Adrès', contact_phone:'Telefòn', contact_email:'Imèl',
    contact_form_title:'Voye yon Mesaj', contact_name:'Non *', contact_email_f:'Imèl *',
    contact_subject:'Sijè', contact_message:'Mesaj *', contact_submit:'Voye Mesaj',
    team_page_title:'Ekip Nou An', team_page_subtitle:'Moun ki dedye ki fè TRAPOSA vizib chak jou.',
    partners_page_title:'Partenè Nou Yo', partners_page_subtitle:'Nou kolabore ak moun ak òganizasyon ki pataje vizyon nou pou yon Ayiti miyò.',
    p1_name:'Djina Guillet Delatour', p1_role:'Otè & Donatè', p1_desc:'Otè ki apiye TRAPOSA — yon pati nan resèt liv li ale dirèkteman bay timoun ki nan bezwen.',
    p2_name:'Kominote Bè-de-En', p2_role:'Patnè Kominote', p2_desc:'Kominote lokal ki travay ansanm ak TRAPOSA pou amelyore edikasyon nan zòn nan.',
    p3_name:'Inisyativ Solidè', p3_role:'Patnè Finansye', p3_desc:'Patnè ki kontribye nan finanse pwogram sipò timoun vilnerab yo.',
    partners_become_title:'Vin Partenè Nou', partners_become_desc:'Èske ou reprezante yon òganizasyon ki vle kolabore avèk nou? Ann ansanm kreye yon enpak pi gran.',
    partners_contact_btn:'Kontakte Nou',
    team1_name:'Dr. Claire Beaumont', team1_role:'Direktris Egzekitif', team1_desc:'Ekspè sante piblik ak 15 an eksperyans nan sektè imanitè a.',
    team2_name:'Jean-Michel Toussaint', team2_role:'Direktè Pwogram', team2_desc:'Spesyalis devlopman kominote ak fòmasyon an agrikilti dirab.',
    team3_name:'Sophie Laroche', team3_role:'Kòdinatris Kominikasyon', team3_desc:'Jounalis ak ekspè kominikasyon pou òganizasyon sosyal.',
    contact_address_label:'Adrès', contact_phone_label:'Telefòn', contact_email_label:'Imèl', contact_send_btn:'Voye Mesaj',
    contact_subject_don:'Enfòmasyon sou don', contact_subject_vol:'Vin bénévòl', contact_subject_partner:'Partenarya', contact_subject_press:'Laprès', contact_subject_other:'Lòt',
    news_badge_success:'Siksè', projects_sort:'Triye:',
    don_page_title:'Fè Yon Don', don_page_subtitle:'Chak kontribisyon ka chanje lavi yon timoun vilnerab ann Ayiti.',
    don_step1:'1. Chwazi Koz ou vle sipote', don_step2:'Chwazi Montant', don_step3:'Metòd Pèman', don_step4:'Enfòmasyon Ou',
    cause_general_title:'Jeneral TRAPOSA / Autres', cause_general_desc:'Sipòte òganizasyon an jeneralman oswa yon lòt koz pa lis la',
    cause1_title:'Edikasyon Timoun', cause1_desc:'Asire aksè edikasyon pou tout timoun yo',
    cause2_title:'Sante Kominote', cause2_desc:'Sèvis sante debaz pou kominote vilnerab',
    cause3_title:'Ijans Imanitè', cause3_desc:'Repon rapid pou kriz imanitè yo',
    don_custom_amount:'Lòt montant', don_credit_card:'Kat Kredi',
    don_donor_name:'Non (Opsyonèl)', don_donor_email:'Imèl (Opsyonèl)', don_anonymous:'Fè don sa a anonim',
    don_submit:'Kontribye Kounye a', don_summary_title:'Rezime Don', don_recent:'Dènye don',
    don_summary_cause:'Koz:', don_summary_amount:'Montant:', don_summary_total:'Total:',
    don_thanks_title:'Mèsi pou Don Ou a!', don_thanks_desc:'Kontribisyon ou pral ede nou kontinye travay nou pou timoun vilnerab yo.',
    don_back_home:'Retounen Akèy', don_receipt:'Telechaje Resi', don_footer:'© 2025 TRAPOSA — Pèman Sekirè',
    don_error_amount_required:'Tanpri chwazi yon montan.',
    don_error_payment_required:'Tanpri chwazi yon metòd pèman.',
    don_error_stripe_unavailable:'Stripe pa disponib. Tanpri kontakte nou.',
    don_error_plop_htg_only:'MonCash / NatCash / Kashpaw aksepte HTG sèlman. Tanpri chwazi HTG.',
    don_error_plop_minimum:'Montan minimòm pou pèman mobil: 20 HTG.',
    don_processing_payment:'Tretman pèman an...',
    don_error_plop_generic:'Erè PLOP PLOP — tanpri eseye ankò.',
    don_error_generic:'Yon erè te fèt. Tanpri eseye ankò.',
    plop_intro_title:'Pèman mobil otomatik',
    plop_intro_desc:'Klike sou <strong>"Kontribye Kounye a"</strong> — yon fenèt pèman sekirize ap ouvri otomatikman.',
    plop_popup_blocked:'Pòp-ap ou a bloke.',
    plop_open_payment:'Ouvri pèman an',
    plop_window_closed:'Fenèt la fèmen. Pèman an poko konfime.',
    plop_timeout:'Pèman an pran twò lontan. Klike "Verifye" pou eseye ankò.',
    plop_overlay_title:'Pèman {method} an ap fèt…',
    plop_overlay_hint:'Konplete pèman an nan fenèt ki ouvri a. Paj sa a ap verifye otomatikman.',
    plop_verify_payment:'Verifye pèman an',
    plop_cancel:'Anile',
    plop_verifying:'Verifikasyon…',
    plop_not_confirmed:'Pèman an poko konfime. Eseye ankò nan kèk segonn.',
    plop_verify_again:'Verifye ankò'
  },
  FR: {
    nav_home:'Accueil', nav_mission:'Mission', nav_projects:'Projets', nav_news:'Actualités',
    nav_team:'Équipe', nav_partners:'Partenaires', nav_contact:'Contact', nav_donate:'Faire un Don',
    hero_eyebrow:'TRAPOSA — Organisation Sociale Haïtienne',
    hero_title_html:'<span class="highlight-green">TRANSFORMER</span> pour Sauver',
    hero_desc:"TRAPOSA est une organisation sociale active en Haïti dont la mission principale est d'aider les enfants vulnérables à améliorer leurs conditions de vie, notamment à travers l'éducation et l'assistance sociale.",
    hero_btn_projects:'Voir Nos Projets', hero_btn_donate:'Faire un Don',
    hero_stat_beneficiaires:'Bénéficiaires', hero_stat_projets:'Projets Actifs', hero_stat_benevoles:'Bénévoles', hero_stat_depatman:'Départements',
    mission_title:'Notre Mission', mission_subtitle:'Trois piliers fondamentaux qui guident toutes nos actions pour un Haïti meilleur',
    mission_p1_title:'Éduquer', mission_p1_desc:"Nous facilitons l'accès à l'éducation pour les enfants en difficulté. L'éducation est la clé pour sortir de la pauvreté et construire un avenir meilleur.",
    mission_p2_title:'Soutenir', mission_p2_desc:"Nous fournissons un soutien de base aux enfants vulnérables : alimentation, vêtements et fournitures scolaires nécessaires pour apprendre.",
    mission_p3_title:'Protéger', mission_p3_desc:"Nous protégeons les enfants contre la pauvreté et l'exclusion. Nous aidons les jeunes à sortir du cycle de la pauvreté et à construire un meilleur avenir.",
    projects_title:'Projets Actifs', projects_subtitle:'Découvrez comment nous aidons les enfants vulnérables à travers le pays',
    filter_all:'Tous', filter_education:'Éducation', filter_sante:'Santé', filter_agri:'Agriculture', filter_env:'Environnement', filter_ijans:'Urgence',
    proj1_title:"Restructuration de l'École Nationale de Baie-de-Henne", proj1_loc:'Baie-de-Henne, Nord-Ouest', proj1_raised:'G700 000', proj1_goal:'sur G1 000 000',
    proj2_title:'Soutien aux Enfants Vulnérables — Nord-Ouest', proj2_loc:'Département du Nord-Ouest', proj2_raised:'G180 000', proj2_goal:'sur G300 000',
    proj3_title:'Programme Éducation Pour Tous', proj3_loc:'Plusieurs Départements, Haïti', proj3_raised:'G85 000', proj3_goal:'sur G200 000',
    projects_btn_all:'Tous les Projets',
    impact_title:'Notre Impact', impact_subtitle:"Des chiffres qui parlent d'eux-mêmes — résultats de nos actions collectives",
    impact_beneficiaires:'Bénéficiaires Directs', impact_projets:'Projets Actifs', impact_years:"Ans d'Activité", impact_communes:'Communes Impliquées',
    news_title:'Actualités Récentes', news_subtitle:'Restez informé des dernières nouvelles et résultats',
    news1_badge:'Succès', news1_date:'il y a 2 jours', news1_title:"L'école nationale de Baie-de-Henne restructurée grâce à TRAPOSA", news1_excerpt:"TRAPOSA a réussi à restructurer l'école nationale de Baie-de-Henne dans le département du Nord-Ouest, donnant à plus d'enfants accès à l'éducation.",
    news2_badge:'Programme', news2_date:'il y a 1 semaine', news2_title:'Plus de 10 000 enfants bénéficient du programme TRAPOSA', news2_excerpt:"Depuis 2022-2023, TRAPOSA a réussi à aider plus de 10 000 enfants vulnérables dans plusieurs départements d'Haïti.",
    news3_badge:'Don', news3_date:'il y a 2 semaines', news3_title:'Djina Guillet Delatour soutient TRAPOSA avec un don spécial', news3_excerpt:"L'auteure Djina Guillet Delatour reverse une partie des recettes de son livre à TRAPOSA pour soutenir les enfants dans le besoin.",
    news_btn_all:'Toutes les Actualités',
    donate_cta_title:'Un Enfant dans le Besoin. Vous Pouvez Aider.', donate_cta_desc:"Chaque don contribue à donner de l'espoir et à changer la vie des enfants vulnérables en Haïti.",
    donate_cta_btn:'Faire un Don Maintenant', donate_security:'Paiement Sécurisé | Protection des Données | Reçu 100%',
    partners_title:'Nos Partenaires', partners_subtitle:'Nous collaborons avec des organisations qui partagent notre vision pour un Haïti meilleur', partners_btn:'Devenir Partenaire',
    volunteer_eyebrow:'Devenir Bénévole', volunteer_title:'Mettez Vos Compétences au Service des Enfants',
    volunteer_desc:"Rejoignez une équipe passionnée dédiée à aider les enfants vulnérables en Haïti. Chaque talent a de la valeur — ensemble, créons le changement.",
    vol_b1:'Formation professionnelle gratuite', vol_b2:'Réseau international dans le secteur humanitaire', vol_b3:'Certificat de reconnaissance', vol_b4:'Expérience qui change la vie',
    vol_form_title:"S'inscrire Maintenant", vol_name:'Nom Complet *', vol_email:'Email *', vol_skills:'Compétences', vol_submit:'Soumettre la Demande',
    footer_desc:"Organisation sociale haïtienne engagée à aider les enfants vulnérables en Haïti grâce à l'éducation et à l'assistance sociale.",
    footer_newsletter:'Abonnement à Notre Bulletin', footer_subscribe:"S'abonner", footer_quick_links:'Liens Rapides',
    footer_contact_title:'Contact', footer_social_title:'Réseaux Sociaux',
    footer_copyright:'© 2025 TRAPOSA. Tous droits réservés.', footer_tagline:'🇭🇹 Fait pour Haïti',
    mission_page_title:'Notre Mission', mission_page_subtitle:'Trois piliers fondamentaux qui guident toutes nos actions pour un Haïti meilleur',
    mission_pp1_title:'1. Éduquer', mission_pp1_desc:"Nous facilitons l'accès à l'éducation pour les enfants en difficulté. Nous croyons que l'éducation est la clé fondamentale pour créer un changement durable dans la vie des enfants.",
    mission_pp2_title:'2. Soutenir', mission_pp2_desc:"Nous fournissons un soutien de base : alimentation, vêtements et fournitures scolaires. Quand les enfants ont ce dont ils ont besoin, ils peuvent se concentrer sur l'apprentissage.",
    mission_pp3_title:'3. Protéger', mission_pp3_desc:"Nous protégeons les enfants vulnérables contre l'exclusion et la pauvreté. Nous aidons les jeunes à construire un avenir meilleur pour eux-mêmes et leurs communautés.",
    mission_values_title:'Nos Valeurs',
    val_solidarity:'Solidarité', val_solidarity_desc:'Nous croyons en la puissance du collectif pour résoudre les problèmes de nos communautés.',
    val_transparency:'Transparence', val_transparency_desc:'Nous nous engageons à rendre compte de chaque gourde dépensée et de chaque action entreprise.',
    val_inclusion:'Inclusion', val_inclusion_desc:'Nous servons tous les enfants sans distinction, en particulier les plus vulnérables.',
    val_efficiency:'Efficacité', val_efficiency_desc:"Nous maximisons l'impact de chaque ressource grâce à une gestion professionnelle et à l'innovation.",
    mission_history_title:'Notre Histoire',
    mission_history_desc:"TRAPOSA est une organisation engagée dans la protection de l'enfance, l'éducation et la lutte contre la pauvreté en Haïti. Notre programme a débuté avec environ 10 000 enfants (2022–2023) et s'est élargi à plus de 10 000 bénéficiaires l'année suivante. L'un de nos projets importants est la restructuration de l'école nationale de Baie-de-Henne dans le département du Nord-Ouest. Notre objectif est d'atteindre encore plus d'enfants à l'échelle nationale.",
    mission_history_btn:'En Savoir Plus sur Nos Programmes',
    projects_page_title:'Nos Projets', projects_page_subtitle:"Découvrez comment nous aidons les enfants vulnérables à travers le pays grâce à nos programmes durables.",
    projects_loading:'Chargement des projets...', projects_search_ph:'Rechercher un projet...', projects_sort_label:'Trier :',
    sort_newest:'Plus récent', sort_goal_high:'Objectif le plus élevé', sort_goal_low:'Objectif le plus bas',
    news_page_title:'Actualités', news_page_subtitle:'Restez informé des dernières nouvelles et résultats.',
    news_pg1_title:"L'école nationale de Baie-de-Henne restructurée grâce à TRAPOSA",
    news_pg2_title:'Plus de 10 000 enfants bénéficient du programme TRAPOSA',
    news_pg3_title:'Djina Guillet Delatour soutient TRAPOSA avec un don spécial',
    contact_page_title:'Contactez-Nous', contact_page_subtitle:'Nous voulons vous entendre. Envoyez un message à notre équipe.',
    contact_info_title:'Informations de Contact', contact_address:'Adresse', contact_phone:'Téléphone', contact_email:'Email',
    contact_form_title:'Envoyer un Message', contact_name:'Nom *', contact_email_f:'Email *',
    contact_subject:'Sujet', contact_message:'Message *', contact_submit:'Envoyer le Message',
    team_page_title:'Notre Équipe', team_page_subtitle:'Les personnes dévouées qui font de TRAPOSA une réalité chaque jour.',
    partners_page_title:'Nos Partenaires', partners_page_subtitle:'Nous collaborons avec des personnes et des organisations qui partagent notre vision pour un Haïti meilleur.',
    p1_name:'Djina Guillet Delatour', p1_role:'Auteure & Donatrice', p1_desc:"Auteure qui soutient TRAPOSA — une partie des recettes de son livre est directement reversée aux enfants dans le besoin.",
    p2_name:'Communauté de Baie-de-Henne', p2_role:'Partenaire Communautaire', p2_desc:"Communauté locale qui travaille avec TRAPOSA pour améliorer l'éducation dans la région.",
    p3_name:'Initiatives Solidaires', p3_role:'Partenaire Financier', p3_desc:'Partenaire qui contribue au financement des programmes de soutien aux enfants vulnérables.',
    partners_become_title:'Devenez Notre Partenaire', partners_become_desc:'Vous représentez une organisation qui souhaite collaborer avec nous ? Ensemble, créons un impact plus grand.',
    partners_contact_btn:'Contactez-Nous',
    team1_name:'Dr. Claire Beaumont', team1_role:'Directrice Exécutive', team1_desc:'Experte en santé publique avec 15 ans d\'expérience dans le secteur humanitaire.',
    team2_name:'Jean-Michel Toussaint', team2_role:'Directeur des Programmes', team2_desc:'Spécialiste en développement communautaire et en formation agricole durable.',
    team3_name:'Sophie Laroche', team3_role:'Coordinatrice Communication', team3_desc:'Journaliste et experte en communication pour les organisations sociales.',
    contact_address_label:'Adresse', contact_phone_label:'Téléphone', contact_email_label:'Email', contact_send_btn:'Envoyer le Message',
    contact_subject_don:'Informations sur les dons', contact_subject_vol:'Devenir bénévole', contact_subject_partner:'Partenariat', contact_subject_press:'Presse', contact_subject_other:'Autre',
    news_badge_success:'Succès', projects_sort:'Trier :',
    don_page_title:'Faire un Don', don_page_subtitle:'Chaque contribution peut changer la vie d\'un enfant vulnérable en Haïti.',
    don_step1:'1. Choisissez la Cause à Soutenir', don_step2:'Choisissez le Montant', don_step3:'Mode de Paiement', don_step4:'Vos Informations',
    cause_general_title:'TRAPOSA Général / Autres', cause_general_desc:'Soutenir l\'organisation en général ou une autre cause non listée',
    cause1_title:'Éducation des Enfants', cause1_desc:'Assurer l\'accès à l\'éducation pour tous les enfants',
    cause2_title:'Santé Communautaire', cause2_desc:'Services de santé de base pour les communautés vulnérables',
    cause3_title:'Urgence Humanitaire', cause3_desc:'Réponse rapide aux crises humanitaires',
    don_custom_amount:'Autre montant', don_credit_card:'Carte de Crédit',
    don_donor_name:'Nom (Optionnel)', don_donor_email:'Email (Optionnel)', don_anonymous:'Faire ce don anonymement',
    don_submit:'Contribuer Maintenant', don_summary_title:'Résumé du Don', don_recent:'Derniers dons',
    don_summary_cause:'Cause :', don_summary_amount:'Montant :', don_summary_total:'Total :',
    don_thanks_title:'Merci pour Votre Don !', don_thanks_desc:'Votre contribution va nous aider à continuer notre travail pour les enfants vulnérables.',
    don_back_home:'Retour à l\'Accueil', don_receipt:'Télécharger le Reçu', don_footer:'© 2025 TRAPOSA — Paiement Sécurisé',
    don_error_amount_required:'Veuillez sélectionner un montant.',
    don_error_payment_required:'Veuillez choisir une méthode de paiement.',
    don_error_stripe_unavailable:'Stripe n’est pas disponible. Veuillez nous contacter.',
    don_error_plop_htg_only:'MonCash / NatCash / Kashpaw acceptent uniquement les paiements en HTG. Veuillez choisir HTG.',
    don_error_plop_minimum:'Montant minimum pour le paiement mobile : 20 HTG.',
    don_processing_payment:'Traitement du paiement...',
    don_error_plop_generic:'Erreur PLOP PLOP — veuillez réessayer.',
    don_error_generic:'Une erreur est survenue. Veuillez réessayer.',
    plop_intro_title:'Paiement mobile automatique',
    plop_intro_desc:'Cliquez sur <strong>"Contribuer Maintenant"</strong> — une fenêtre de paiement sécurisée s’ouvrira automatiquement.',
    plop_popup_blocked:'La fenêtre de paiement a été bloquée.',
    plop_open_payment:'Ouvrir le paiement',
    plop_window_closed:'La fenêtre a été fermée. Le paiement n’est pas encore confirmé.',
    plop_timeout:'Le paiement prend trop de temps. Cliquez sur "Vérifier" pour réessayer.',
    plop_overlay_title:'Paiement {method} en cours…',
    plop_overlay_hint:'Complétez le paiement dans la fenêtre ouverte. Cette page vérifiera automatiquement.',
    plop_verify_payment:'Vérifier le paiement',
    plop_cancel:'Annuler',
    plop_verifying:'Vérification…',
    plop_not_confirmed:'Le paiement n’est pas encore confirmé. Réessayez dans quelques secondes.',
    plop_verify_again:'Vérifier à nouveau'
  },
  EN: {
    nav_home:'Home', nav_mission:'Mission', nav_projects:'Projects', nav_news:'News',
    nav_team:'Team', nav_partners:'Partners', nav_contact:'Contact', nav_donate:'Donate',
    hero_eyebrow:'TRAPOSA — Haitian Social Organization',
    hero_title_html:'<span class="highlight-green">TRANSFORMING</span> to Save',
    hero_desc:'TRAPOSA is a social organization active in Haiti whose main mission is to help vulnerable children improve their living conditions, especially through education and social assistance.',
    hero_btn_projects:'View Our Projects', hero_btn_donate:'Donate Now',
    hero_stat_beneficiaires:'Beneficiaries', hero_stat_projets:'Active Projects', hero_stat_benevoles:'Volunteers', hero_stat_depatman:'Departments',
    mission_title:'Our Mission', mission_subtitle:'Three fundamental pillars that guide all our actions for a better Haiti',
    mission_p1_title:'Educate', mission_p1_desc:'We facilitate access to education for children in difficulty. Education is the key to breaking out of poverty and building a better future.',
    mission_p2_title:'Support', mission_p2_desc:'We provide basic support to vulnerable children: food, clothing, and school supplies they need to be able to learn.',
    mission_p3_title:'Protect', mission_p3_desc:'We protect children from poverty and exclusion. We help young people break the cycle of poverty and build a better future.',
    projects_title:'Active Projects', projects_subtitle:'Discover how we are helping vulnerable children across the country',
    filter_all:'All', filter_education:'Education', filter_sante:'Health', filter_agri:'Agriculture', filter_env:'Environment', filter_ijans:'Emergency',
    proj1_title:'Restructuring of the National School of Baie-de-Henne', proj1_loc:'Baie-de-Henne, Nord-Ouest', proj1_raised:'G700,000', proj1_goal:'of G1,000,000',
    proj2_title:'Support for Vulnerable Children — Nord-Ouest', proj2_loc:'Nord-Ouest Department', proj2_raised:'G180,000', proj2_goal:'of G300,000',
    proj3_title:'Education for All Program', proj3_loc:'Multiple Departments, Haiti', proj3_raised:'G85,000', proj3_goal:'of G200,000',
    projects_btn_all:'All Projects',
    impact_title:'Our Impact', impact_subtitle:'Numbers that speak for themselves — results of our collective actions',
    impact_beneficiaires:'Direct Beneficiaries', impact_projets:'Active Projects', impact_years:'Years of Activity', impact_communes:'Communes Involved',
    news_title:'Recent News', news_subtitle:'Stay informed about our latest news and results',
    news1_badge:'Success', news1_date:'2 days ago', news1_title:'Baie-de-Henne National School restructured thanks to TRAPOSA', news1_excerpt:'TRAPOSA successfully restructured the national school of Baie-de-Henne in the Nord-Ouest department, giving more children access to education.',
    news2_badge:'Program', news2_date:'1 week ago', news2_title:"More than 10,000 children benefit from TRAPOSA's program", news2_excerpt:'Since 2022-2023, TRAPOSA has helped more than 10,000 vulnerable children across multiple departments in Haiti.',
    news3_badge:'Donation', news3_date:'2 weeks ago', news3_title:'Djina Guillet Delatour supports TRAPOSA with a special donation', news3_excerpt:'Author Djina Guillet Delatour donates a portion of her book revenues to TRAPOSA to support children in need.',
    news_btn_all:'All News',
    donate_cta_title:'A Child in Need. You Can Help.', donate_cta_desc:'Every donation contributes to giving hope and changing the lives of vulnerable children in Haiti.',
    donate_cta_btn:'Donate Now', donate_security:'Secure Payment | Data Protection | 100% Receipt',
    partners_title:'Our Partners', partners_subtitle:'We collaborate with organizations that share our vision for a better Haiti', partners_btn:'Become a Partner',
    volunteer_eyebrow:'Become a Volunteer', volunteer_title:'Put Your Skills at the Service of Children',
    volunteer_desc:"Join a passionate team dedicated to helping vulnerable children in Haiti. Every talent has value — together, let's create change.",
    vol_b1:'Free professional training', vol_b2:'International network in the humanitarian sector', vol_b3:'Certificate of recognition', vol_b4:'Life-changing experience',
    vol_form_title:'Register Now', vol_name:'Full Name *', vol_email:'Email *', vol_skills:'Skills', vol_submit:'Submit Application',
    footer_desc:'Haitian social organization committed to helping vulnerable children in Haiti through education and social assistance.',
    footer_newsletter:'Newsletter Subscription', footer_subscribe:'Subscribe', footer_quick_links:'Quick Links',
    footer_contact_title:'Contact', footer_social_title:'Social Media',
    footer_copyright:'© 2025 TRAPOSA. All rights reserved.', footer_tagline:'🇭🇹 Made for Haiti',
    mission_page_title:'Our Mission', mission_page_subtitle:'Three fundamental pillars that guide all our actions for a better Haiti',
    mission_pp1_title:'1. Educate', mission_pp1_desc:"We facilitate access to education for children in difficulty. We believe education is the fundamental key to creating lasting change in children's lives.",
    mission_pp2_title:'2. Support', mission_pp2_desc:'We provide basic support: food, clothing, and school supplies. When children have what they need, they can focus on learning.',
    mission_pp3_title:'3. Protect', mission_pp3_desc:"We protect vulnerable children from exclusion and poverty. We help young people build a better future for themselves and their communities.",
    mission_values_title:'Our Values',
    val_solidarity:'Solidarity', val_solidarity_desc:'We believe in the power of working together to solve the problems in our communities.',
    val_transparency:'Transparency', val_transparency_desc:'We are committed to being accountable for every gourde spent and every action taken.',
    val_inclusion:'Inclusion', val_inclusion_desc:'We serve all children without distinction, especially the most vulnerable.',
    val_efficiency:'Efficiency', val_efficiency_desc:'We maximize the impact of every resource through professional management and innovation.',
    mission_history_title:'Our Story',
    mission_history_desc:"TRAPOSA is an organization committed to child protection, education, and the fight against poverty in Haiti. Our program started with around 10,000 children (2022–2023) and expanded to more than 10,000 beneficiaries the following year. One of our key projects is the restructuring of the national school of Baie-de-Henne in the Nord-Ouest department. Our goal is to reach even more children nationwide.",
    mission_history_btn:'Learn More About Our Programs',
    projects_page_title:'Our Projects', projects_page_subtitle:'Discover how we help vulnerable children across the country through our sustainable programs.',
    projects_loading:'Loading projects...', projects_search_ph:'Search projects...', projects_sort_label:'Sort:',
    sort_newest:'Most recent', sort_goal_high:'Highest goal', sort_goal_low:'Lowest goal',
    news_page_title:'News', news_page_subtitle:'Stay informed about our latest news and results.',
    news_pg1_title:'Baie-de-Henne National School restructured thanks to TRAPOSA',
    news_pg2_title:"More than 10,000 children benefit from TRAPOSA's program",
    news_pg3_title:'Djina Guillet Delatour supports TRAPOSA with a special donation',
    contact_page_title:'Contact Us', contact_page_subtitle:'We want to hear from you. Send a message to our team.',
    contact_info_title:'Contact Information', contact_address:'Address', contact_phone:'Phone', contact_email:'Email',
    contact_form_title:'Send a Message', contact_name:'Name *', contact_email_f:'Email *',
    contact_subject:'Subject', contact_message:'Message *', contact_submit:'Send Message',
    team_page_title:'Our Team', team_page_subtitle:'The dedicated people who make TRAPOSA visible every day.',
    partners_page_title:'Our Partners', partners_page_subtitle:'We collaborate with people and organizations that share our vision for a better Haiti.',
    p1_name:'Djina Guillet Delatour', p1_role:'Author & Donor', p1_desc:"Author who supports TRAPOSA — a portion of her book revenues goes directly to children in need.",
    p2_name:'Baie-de-Henne Community', p2_role:'Community Partner', p2_desc:'Local community that works with TRAPOSA to improve education in the region.',
    p3_name:'Solidarity Initiatives', p3_role:'Financial Partner', p3_desc:'Partner that contributes to funding programs supporting vulnerable children.',
    partners_become_title:'Become Our Partner', partners_become_desc:"Do you represent an organization that wants to collaborate with us? Together, let's create a greater impact.",
    partners_contact_btn:'Contact Us',
    team1_name:'Dr. Claire Beaumont', team1_role:'Executive Director', team1_desc:'Public health expert with 15 years of experience in the humanitarian sector.',
    team2_name:'Jean-Michel Toussaint', team2_role:'Programs Director', team2_desc:'Specialist in community development and sustainable agricultural training.',
    team3_name:'Sophie Laroche', team3_role:'Communications Coordinator', team3_desc:'Journalist and communications expert for social organizations.',
    contact_address_label:'Address', contact_phone_label:'Phone', contact_email_label:'Email', contact_send_btn:'Send Message',
    contact_subject_don:'Donation information', contact_subject_vol:'Become a volunteer', contact_subject_partner:'Partnership', contact_subject_press:'Press', contact_subject_other:'Other',
    news_badge_success:'Success', projects_sort:'Sort:',
    don_page_title:'Make a Donation', don_page_subtitle:'Every contribution can change the life of a vulnerable child in Haiti.',
    don_step1:'1. Choose the Cause to Support', don_step2:'Choose Amount', don_step3:'Payment Method', don_step4:'Your Information',
    cause_general_title:'TRAPOSA General / Others', cause_general_desc:'Support the organization in general or another cause not listed',
    cause1_title:'Children Education', cause1_desc:'Ensure access to education for all children',
    cause2_title:'Community Health', cause2_desc:'Basic health services for vulnerable communities',
    cause3_title:'Humanitarian Emergency', cause3_desc:'Rapid response to humanitarian crises',
    don_custom_amount:'Other amount', don_credit_card:'Credit Card',
    don_donor_name:'Name (Optional)', don_donor_email:'Email (Optional)', don_anonymous:'Make this donation anonymous',
    don_submit:'Contribute Now', don_summary_title:'Donation Summary', don_recent:'Recent donations',
    don_summary_cause:'Cause:', don_summary_amount:'Amount:', don_summary_total:'Total:',
    don_thanks_title:'Thank You for Your Donation!', don_thanks_desc:'Your contribution will help us continue our work for vulnerable children.',
    don_back_home:'Back to Home', don_receipt:'Download Receipt', don_footer:'© 2025 TRAPOSA — Secure Payment',
    don_error_amount_required:'Please select an amount.',
    don_error_payment_required:'Please select a payment method.',
    don_error_stripe_unavailable:'Stripe is not available. Please contact us.',
    don_error_plop_htg_only:'MonCash / NatCash / Kashpaw only accept HTG. Please choose HTG.',
    don_error_plop_minimum:'Minimum amount for mobile payment: 20 HTG.',
    don_processing_payment:'Processing payment...',
    don_error_plop_generic:'PLOP PLOP error — please try again.',
    don_error_generic:'An error occurred. Please try again.',
    plop_intro_title:'Automatic mobile payment',
    plop_intro_desc:'Click <strong>"Contribute Now"</strong> — a secure payment window will open automatically.',
    plop_popup_blocked:'Your payment popup was blocked.',
    plop_open_payment:'Open payment',
    plop_window_closed:'The window was closed. Payment is not confirmed yet.',
    plop_timeout:'Payment is taking too long. Click "Verify" to try again.',
    plop_overlay_title:'{method} payment in progress…',
    plop_overlay_hint:'Complete the payment in the opened window. This page will verify automatically.',
    plop_verify_payment:'Verify payment',
    plop_cancel:'Cancel',
    plop_verifying:'Verifying…',
    plop_not_confirmed:'Payment is not confirmed yet. Try again in a few seconds.',
    plop_verify_again:'Verify again'
  }
};

// Get translation helper
function t(key, lang = null) {
  const currentLang = lang || localStorage.getItem('traposa-lang') || 'HT';
  return translations[currentLang]?.[key] || translations.HT[key] || key;
}
