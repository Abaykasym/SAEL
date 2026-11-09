/* Editorial service content based on the published SAEL service pages. */
window.saelServiceContent = {
  preparation: {
    sourceUrl: "https://sael.kg/ru/services/sample-preparation/",
    ru: {
      lead: "От регистрации и хранения до получения представительной аналитической пробы. Подбираем схему подготовки под материал, массу и последующий метод анализа.",
      overviewTitle: "Представительная проба — основа достоверного анализа",
      overview: [
        "Пробоподготовка даёт однородный представительный материал для анализа. SAEL предлагает пакеты и отдельные операции для керна, пород, сколковых проб, почв и донных отложений. Пакеты включают регистрацию и взвешивание.",
        "Каждая проба получает штрихкод в собственной LIMS лаборатории. Система отслеживает операции и место хранения. Доставку наземным или воздушным транспортом можно согласовать со специалистом."
      ],
      facts: [["LIMS", "регистрация и штрихкодирование"], ["90 дней", "хранение аналитических пульп"], ["45 дней", "хранение дроблёных остатков"]],
      methodsTitle: "Пакет подготовки под вашу задачу",
      methods: [
        {title:"Сушка", text:"Для почв и осадков выбирают низкую температуру, для некоторых селективных методов — сушку на воздухе. Дополнительную сушку влажных проб согласуют с клиентом."},
        {title:"Дробление", text:"Щековые дробилки уменьшают крупность перед истиранием. При крупном золоте особенно важны размер частиц и представительность материала."},
        {title:"Сокращение", text:"После дробления выделяют представительную часть. Её массу выбирают под неоднородность материала и последующий анализ."},
        {title:"Истирание", text:"Для низкосортных и неминерализованных пород обычна пульпа 250 г; ситовой пробирный анализ золота может требовать большей массы. Применяется низкохромистая сталь; агат, карбид вольфрама и оксид циркония — по запросу."},
        {title:"Специальные процедуры", text:"Возможны индивидуальные схемы и композиционные пробы. Для минерализованных материалов заранее согласуют очистку оборудования между пробами."}
      ],
      sampleTags: ["Буровой керн", "Горные породы", "Сколковые пробы", "Почвы", "Донные отложения"],
      requirements: ["Укажите материал, массу каждой пробы и последующий анализ.", "Сообщите о крупном золоте, высокой минерализации и возможных загрязняющих компонентах.", "Согласуйте крупность дробления, массу пульпы и материал размольной гарнитуры.", "До отправки уточните упаковку, маркировку, перечень проб и способ доставки."],
      result: "Подготовленная однородная проба по согласованной схеме с регистрацией и прослеживаемостью в лаборатории.",
      note: "Бесплатное хранение после финального отчёта: пульпы — 90 дней, дроблёные остатки — 45 дней. Более длительное хранение оплачивается ежемесячно по согласованию.",
      faq: [["Можно ли изменить стандартный пакет?", "Да. Отдельные операции и параметры подготовки можно объединить под требования проекта после согласования с лабораторией."], ["Нужно ли сушить пробы перед отправкой?", "Самостоятельную сушку сначала согласуйте: температура и условия могут влиять на летучие элементы и последующий метод. При необходимости лаборатория предложит подходящий режим."], ["Как избежать переноса материала между пробами?", "Сообщите о минерализованных образцах и ожидаемых высоких содержаниях. Лаборатория согласует очистку оборудования и последовательность подготовки."]]
    },
    kg: {
      lead: "Каттоо жана сактоодон тартып өкүлчүлүктүү аналитикалык үлгү алууга чейин. Даярдоо схемасы материалга, массага жана кийинки талдоо ыкмасына жараша тандалат.",
      overviewTitle: "Өкүлчүлүктүү үлгү — ишенимдүү талдоонун негизи",
      overview: [
        "Даярдоонун максаты — баштапкы материалдан бир тектүү аналитикалык үлгү алуу. SAEL керн, тоо тектери, сынык үлгүлөр, топурак жана түпкү чөкмөлөр үчүн даяр пакеттерди жана өзүнчө операцияларды сунуштайт. Ар бир пакетке көзөмөлдөө системасында каттоо жана таразага тартуу кирет.",
        "Келген материал лабораториянын өзүнүн LIMS системасында катталып, штрихкод алат. Система үлгүнү аткарылган операциялар жана сакталган жери менен байланыштырат. Адистер жер же аба транспорту менен жеткирүүнү да макулдашууга жардам берет."
      ],
      facts: [["LIMS", "каттоо жана штрихкод берүү"], ["90 күн", "аналитикалык пульпаларды сактоо"], ["45 күн", "майдаланган калдыктарды сактоо"]],
      methodsTitle: "Тапшырмаңызга ылайык даярдоо пакети",
      methods: [
        {title:"Кургатуу", text:"Режим материалга жана аныкталуучу элементтерге жараша тандалат. Топурак жана чөкмөлөр үчүн төмөн температура маанилүү; айрым тандалма эритүү схемаларында абада кургатуу талап кылынышы мүмкүн. Нымдуу үлгүлөрдү кошумча кургатуу кардар менен макулдашылат."},
        {title:"Майдалоо", text:"Жаактуу майдалагычтар материалды сүртүп майдалоого чейин кичирейтет. Бөлүкчөлөрдүн өлчөмү долбоорго жараша, айрыкча ири алтын болгондо же өкүлчүлүктүүлүккө коркунуч жаралганда такталат."},
        {title:"Кыскартуу", text:"Майдалоодон кийин материалдын өкүлчүлүктүү бөлүгү бөлүнөт. Кыскартылган үлгүнүн массасы баштапкы материалдын бир тектүүлүгүнө жана кийинки талдоого жараша макулдашылат."},
        {title:"Сүртүп майдалоо", text:"Төмөн камтуудагы жана минералдашпаган тектер үчүн 250 г пульпа кеңири колдонулат; алтындын ситалык талдоосуна көбүрөөк масса керек болушу мүмкүн. Аз хромдуу болот колдонулат; агат, вольфрам карбиди жана цирконий оксиди — суроо боюнча."},
        {title:"Атайын процедуралар", text:"Операцияларды жеке схемага, анын ичинде курама үлгүлөрдү даярдоого бириктирүүгө болот. Минералдашкан материалдар үчүн үлгүлөрдүн ортосунда жабдууну тазалоо алдын ала макулдашылат."}
      ],
      sampleTags: ["Бургулоо керни", "Тоо тектери", "Сынык үлгүлөр", "Топурак", "Түпкү чөкмөлөр"],
      requirements: ["Материалды, ар бир үлгүнүн массасын жана кийинки талдоону көрсөтүңүз.", "Ири алтын, жогорку минералдашуу жана мүмкүн болгон булгоочу компоненттер тууралуу кабарлаңыз.", "Майдалыкты, пульпанын массасын жана майдалоочу гарнитуранын материалын макулдашыңыз.", "Жөнөтүүдөн мурда таңгакты, маркировканы, үлгүлөрдүн тизмесин жана жеткирүү жолун тактаңыз."],
      result: "Макулдашылган схема боюнча даярдалган бир тектүү үлгү, лабораторияда каттоо жана көзөмөлдөө мүмкүнчүлүгү менен.",
      note: "Акысыз сактоо акыркы отчеттон кийин башталат: пульпалар — 90 күн, майдаланган калдыктар — 45 күн. Узак сактоо макулдашуу боюнча ай сайын төлөнөт.",
      faq: [["Стандарттык пакетти өзгөртсө болобу?", "Ооба. Даярдоонун операцияларын жана параметрлерин лаборатория менен макулдашып, долбоордун талабына ылайык бириктирүүгө болот."], ["Жөнөтүүдөн мурда үлгүлөрдү кургатуу керекпи?", "Өз алдынча кургатууну адегенде макулдашыңыз: температура жана шарттар учма элементтерге жана кийинки ыкмага таасир этиши мүмкүн. Керек болсо лаборатория ылайыктуу режимди сунуштайт."], ["Үлгүлөрдүн ортосунда материалдын өтүшүн кантип азайтууга болот?", "Минералдашкан үлгүлөр жана күтүлгөн жогорку камтуулар тууралуу айтыңыз. Лаборатория жабдууну тазалоону жана даярдоонун кезектүүлүгүн макулдашат."]]
    },
    en: {
      lead: "From registration and storage to a representative analytical sample. Preparation is selected for the material, sample mass and subsequent analytical method.",
      overviewTitle: "A representative sample supports reliable analysis",
      overview: [
        "Preparation turns submitted material into a homogeneous analytical sample. SAEL offers standard packages and individual operations for drill core, rocks, rock chips, soils and sediments. Each package includes registration in the tracking system and weighing.",
        "On receipt, material is registered in the laboratory’s own LIMS and assigned a barcode. The system links samples to operations and storage locations. Specialists can also help arrange delivery by road or air."
      ],
      facts: [["LIMS", "registration and barcode tracking"], ["90 days", "analytical pulp storage"], ["45 days", "coarse reject storage"]],
      methodsTitle: "A preparation package for your project",
      methods: [
        {title:"Drying", text:"Conditions depend on the material and target elements. Low temperatures matter for soils and sediments; some selective leach procedures may require air drying. Additional drying of wet samples is agreed with the client."},
        {title:"Crushing", text:"Jaw crushers reduce particle size before pulverizing. The target size is confirmed for each project, particularly where coarse gold or sample representativity is a concern."},
        {title:"Splitting", text:"A representative portion is selected after crushing. Its mass is agreed with regard to the heterogeneity of the original sample and the subsequent analysis."},
        {title:"Pulverizing", text:"A 250 g pulp is common for low-grade and unmineralized rock; screen fire assay may require more. Low-chromium steel media are used, with agate, tungsten carbide and zirconia options on request."},
        {title:"Special procedures", text:"Operations can be combined into a custom scheme, including composite preparation. Equipment cleaning between mineralized samples is agreed in advance."}
      ],
      sampleTags: ["Drill core", "Rock", "Rock chips", "Soil", "Sediment"],
      requirements: ["State the material, mass of each sample and subsequent analysis.", "Disclose coarse gold, strong mineralization and potential contaminants.", "Confirm crushing size, pulp mass and grinding media.", "Before shipment, agree packaging, labels, sample list and delivery arrangements."],
      result: "A homogeneous sample prepared to the agreed scheme, with laboratory registration and traceability.",
      note: "Free storage starts at the final report: 90 days for pulps and 45 days for coarse rejects. Extended storage is charged monthly by agreement.",
      faq: [["Can a standard package be changed?", "Yes. Individual operations and preparation parameters can be combined to meet project requirements after review with the laboratory."], ["Should samples be dried before shipping?", "Agree any drying first: temperature and conditions can affect volatile elements and the subsequent method. The laboratory can recommend suitable conditions."], ["How is carryover between samples addressed?", "Tell the laboratory about mineralized samples and expected high grades. Equipment cleaning and the preparation sequence can then be agreed."]]
    }
  },
  "precious-metals": {
    sourceUrl: "https://sael.kg/ru/services/precious-metals/",
    ru: {
      lead: "Золото, серебро и металлы платиновой группы: аналитическую схему выбираем по матрице, крупности золота, ожидаемому содержанию и цели исследования.",
      overviewTitle: "Метод должен учитывать характер минерализации",
      overview: ["Состав минералов, распределение металла и размер его частиц влияют на извлечение и представительность анализа. Для золота SAEL подбирает состав флюса и программу контроля качества; сведения о сложной матрице важно передать до начала работ.", "Для проб с крупным золотом или высоким содержанием рекомендуется ситовой пробирный анализ. В проекте можно заранее согласовать повторный анализ другим методом при превышении установленного порога содержания."],
      facts: [["Au · Ag", "золото и серебро"], ["Pt · Pd", "металлы платиновой группы"], ["500 г–3 кг", "масса для схем BLEG"]],
      methodsTitle: "Аналитические схемы",
      methods: [
        {title:"Пробирный анализ золота", text:"Подходит для определения общего золота. Схему и окончание выбирают с учётом матрицы и диапазона содержаний. Информация о хромите, сульфидах, оксидах, селенидах и теллуридах помогает скорректировать флюс."},
        {title:"Золото с рассевом", text:"Ситовой пробирный анализ помогает учитывать крупное золото и снижать влияние неоднородного распределения металла. Массу и параметры подготовки согласуют заранее."},
        {title:"Цианидное выщелачивание BLEG", text:"В поисковых работах большая масса помогает выявлять слабые золотые аномалии. Применяются массы от 500 г до 3 кг; процедуры для 1 кг и более согласуются по запросу."},
        {title:"Серебро", text:"Для следовых и низких содержаний применяется кислотное разложение. При неоднородном распределении серебра повторные определения помогают оценить влияние эффекта самородка."},
        {title:"Платина и палладий", text:"Au, Pt и Pd могут определяться совместно пробирным анализом со свинцовым коллектором и ICP-AES окончанием. Полный перечень ЭПГ требует отдельной схемы; вариант с сульфидом никеля и нейтронной активацией согласуется отдельно."}
      ],
      sampleTags: ["Геологические пробы", "Руды", "Концентраты", "Подготовленные пульпы"],
      requirements: ["Укажите определяемые металлы и ожидаемые содержания.", "Опишите минерализацию и наличие видимого или крупного золота.", "Согласуйте массу, подготовку, метод окончания и правила повторного анализа.", "Приложите перечень проб и техническую задачу для расчёта программы."],
      result: "Результаты по согласованным металлам и аналитической схеме, с идентификацией образцов и выбранного метода.",
      note: "BLEG, пробирный анализ и кислотное разложение решают разные задачи. Окончательный выбор метода и необходимую массу образца подтверждает лаборатория.",
      faq: [["Какой метод выбрать для золота?", "Укажите материал, диапазон содержаний и цель работы. При наличии крупного золота отдельно обсудите ситовой пробирный анализ."], ["Можно ли заранее предусмотреть повторный анализ высоких содержаний?", "Да. Для проекта можно согласовать порог и переход на метод, рассчитанный на более высокие содержания."], ["Одинакова ли схема для всех металлов платиновой группы?", "Нет. Совместное определение Au, Pt и Pd и полный перечень ЭПГ требуют разных аналитических схем. Укажите нужный список элементов."]]
    },
    kg: {
      lead: "Алтын, күмүш жана платина тобундагы металлдар: талдоо схемасы матрицага, алтындын ирилигине, күтүлгөн камтууга жана изилдөөнүн максатына жараша тандалат.",
      overviewTitle: "Ыкма минералдашуунун өзгөчөлүгүн эске алышы керек",
      overview: ["Минералдык курам, металлдын таралышы жана бөлүкчөлөрдүн өлчөмү бөлүп алууга жана талдоонун өкүлчүлүктүүлүгүнө таасир этет. Алтын үчүн SAEL флюстун курамын жана сапат контролунун программасын тандайт; татаал матрица тууралуу маалыматты иш башталганга чейин берүү маанилүү.", "Ири алтын же жогорку камтуу болгон үлгүлөр үчүн ситалык пробирдик талдоо сунушталат. Долбоордо белгилүү чек ашканда башка ыкма менен кайталап талдоону алдын ала макулдашууга болот."],
      facts: [["Au · Ag", "алтын жана күмүш"], ["Pt · Pd", "платина тобундагы металлдар"], ["500 г–3 кг", "BLEG схемалары үчүн масса"]],
      methodsTitle: "Аналитикалык схемалар",
      methods: [
        {title:"Алтындын пробирдик талдоосу", text:"Жалпы алтынды аныктоого колдонулат. Схема жана акыркы өлчөө матрицага жана камтуунун диапазонуна жараша тандалат. Хромит, сульфиддер, оксиддер, селениддер жана теллуриддер тууралуу маалымат флюсту тууралоого жардам берет."},
        {title:"Элөө менен алтынды аныктоо", text:"Ситалык пробирдик талдоо ири алтынды эске алып, металлдын бирдей эмес таралышынын таасирин азайтууга жардам берет. Масса жана даярдоо параметрлери алдын ала макулдашылат."},
        {title:"BLEG цианиддик эритүү", text:"Издөө иштеринде алтындын алсыз аномалияларын аныктоого чоң масса жардам берет. 500 гдан 3 кгга чейинки массалар колдонулат; 1 кг жана андан чоң процедуралар суроо боюнча макулдашылат."},
        {title:"Күмүш", text:"Из жана төмөн камтуулар үчүн кислота менен ажыратуу колдонулат. Күмүш бирдей эмес таралганда кайталап аныктоолор самородок эффектинин таасирин баалоого жардам берет."},
        {title:"Платина жана палладий", text:"Au, Pt жана Pd коргошун коллектору жана ICP-AES менен аяктаган пробирдик талдоо аркылуу чогуу аныкталышы мүмкүн. Платина тобунун толук тизмеси башка схеманы талап кылат; никель сульфиди жана нейтрондук активация варианты өзүнчө макулдашылат."}
      ],
      sampleTags: ["Геологиялык үлгүлөр", "Руда", "Концентраттар", "Даяр пульпалар"],
      requirements: ["Аныкталуучу металлдарды жана күтүлгөн камтууларды көрсөтүңүз.", "Минералдашууну, көрүнгөн же ири алтындын бар экенин сүрөттөңүз.", "Массаны, даярдоону, акыркы өлчөөнү жана кайталап талдоо эрежелерин макулдашыңыз.", "Программаны эсептөө үчүн үлгүлөрдүн тизмесин жана техникалык тапшырманы тиркеңиз."],
      result: "Үлгүлөрдү жана тандалган ыкманы идентификациялоо менен макулдашылган металлдар жана талдоо схемасы боюнча жыйынтыктар.",
      note: "BLEG, пробирдик талдоо жана кислота менен ажыратуу ар башка тапшырмаларды чечет. Акыркы ыкманы жана керектүү үлгү массасын лаборатория ырастайт.",
      faq: [["Алтын үчүн кайсы ыкманы тандоо керек?", "Материалды, камтуунун диапазонун жана иштин максатын көрсөтүңүз. Ири алтын бар болсо ситалык пробирдик талдоону өзүнчө талкуулаңыз."], ["Жогорку камтууларды кайталап талдоону алдын ала пландаса болобу?", "Ооба. Долбоор үчүн чекти жана жогорку камтууга ылайыктуу ыкмага өтүүнү макулдашууга болот."], ["Платина тобунун бардык металлдары үчүн схема бирдейби?", "Жок. Au, Pt, Pdни чогуу аныктоо жана топтун толук тизмеси ар башка схемаларды талап кылат. Керектүү элементтердин тизмесин бериңиз."]]
    },
    en: {
      lead: "Gold, silver and platinum group metals: the analytical scheme is selected for the matrix, gold grain size, expected grade and project objective.",
      overviewTitle: "The method should reflect the mineralization",
      overview: ["Mineralogy, metal distribution and particle size affect recovery and representativity. For gold, SAEL selects flux composition and quality controls; information about a difficult matrix should be provided before work starts.", "Screen fire assay is recommended where coarse gold or high grades are present. A project can include an agreed threshold for automatic repeat analysis using a method suitable for higher grades."],
      facts: [["Au · Ag", "gold and silver"], ["Pt · Pd", "platinum group metals"], ["500 g–3 kg", "sample mass for BLEG schemes"]],
      methodsTitle: "Analytical schemes",
      methods: [
        {title:"Gold fire assay", text:"Used to determine total gold. The scheme and finish depend on the matrix and grade range. Information about chromite, sulphides, oxides, selenides and tellurides helps optimize the flux."},
        {title:"Screen fire assay", text:"Screen fire assay helps account for coarse gold and reduce the impact of uneven metal distribution. Sample mass and preparation parameters are agreed in advance."},
        {title:"BLEG cyanide leaching", text:"In exploration, a large sample mass helps identify subtle gold anomalies. Masses range from 500 g to 3 kg; procedures for 1 kg and above are agreed on request."},
        {title:"Silver", text:"Acid digestion is used for trace and low grades. Where silver distribution is uneven, repeat determinations help assess the influence of the nugget effect."},
        {title:"Platinum and palladium", text:"Au, Pt and Pd can be determined together by lead-collection fire assay with an ICP-AES finish. A full PGM suite requires a separate scheme; nickel sulphide collection with neutron activation is reviewed separately."}
      ],
      sampleTags: ["Geological samples", "Ore", "Concentrates", "Prepared pulps"],
      requirements: ["List the required metals and expected grades.", "Describe the mineralization and any visible or coarse gold.", "Agree mass, preparation, analytical finish and repeat-analysis rules.", "Attach a sample list and technical specification for program costing."],
      result: "Results for the agreed metals and analytical scheme, identifying the samples and selected method.",
      note: "BLEG, fire assay and acid digestion address different objectives. The laboratory confirms the final method and required sample mass.",
      faq: [["Which gold method should I choose?", "Provide the material, expected grade range and project objective. Discuss screen fire assay separately where coarse gold is present."], ["Can high-grade repeats be planned in advance?", "Yes. A project can include an agreed threshold and a change to a method suitable for higher grades."], ["Is the same scheme used for all PGMs?", "No. Combined Au, Pt and Pd determination and a full PGM suite require different schemes. Specify the elements required."]]
    }
  },
  "multi-element": {
    sourceUrl: "https://sael.kg/ru/services/multi-element/",
    ru: {
      lead: "Многоэлементные пакеты ICP-MS и ICP-AES для геологоразведки и технологических материалов. Выбор разложения определяет, какую часть элемента показывает результат.",
      overviewTitle: "От минералогии — к подходящему разложению",
      overview: ["Тип материала, целевые элементы и элементы-индикаторы определяют аналитическую схему. SAEL предлагает ультраследовые пакеты на 46 элементов с ICP-MS и ICP-AES, а также следовые пакеты на 35 элементов с ICP-AES.", "Для большинства геологических матриц царско-водочный результат характеризует извлекаемую часть элемента. Четырёхкислотное разложение близко к полному, но упорные минералы могут потребовать сплавления. При выборе пакета учитывают эти ограничения."],
      facts: [["46 элементов", "ультраследовые пакеты"], ["35 элементов", "следовые пакеты ICP-AES"], ["от 1 г", "аналитическая навеска описанных пакетов"]],
      methodsTitle: "Методы разложения и измерения",
      methods: [
        {title:"Царская водка · ICP-MS / ICP-AES", text:"Для ультраследового определения элементов в керне и породах. Хорошо извлекает многие сульфиды, оксиды и карбонаты, но не обеспечивает полного растворения силикатов и упорных оксидов."},
        {title:"Четыре кислоты · ICP-MS / ICP-AES", text:"Растворяет большинство минералов геологических материалов. Для барита и ряда упорных минералов редкоземельных элементов, олова и вольфрама может потребоваться другая подготовка."},
        {title:"Следовые пакеты ICP-AES", text:"Пакеты на 35 элементов доступны с царско-водочным и четырёхкислотным разложением. Для низкосортных минерализованных материалов также предусмотрены отдельные аналитические схемы."},
        {title:"Сплавление с боратом лития", text:"Сплавление, кислотное растворение и ICP-MS используют для более полного определения широкого спектра элементов, включая элементы в упорных минералах."},
        {title:"Технологические материалы", text:"Отдельные схемы применяются к концентратам, углю, Доре и растворам. Для Доре используют пробирный анализ минимум на двух дубликатах, для примесей — ICP-AES после царской водки; производственные растворы исследуют на ICP-AES."},
        {title:"Навески технологических материалов", text:"Для угля указаны 5 г на химический анализ и 100 г на испытания; для концентратов — 50 г, для Доре — 1 г. Анализ концентратов поддерживает металлургические испытания и оптимизацию извлечения. Массу отправляемого материала согласуют отдельно."}
      ],
      sampleTags: ["Керн и породы", "Руды", "Концентраты", "Активированный уголь", "Сплавы Доре", "Производственные растворы"],
      requirements: ["Предоставьте список элементов, ожидаемые диапазоны и цель исследования.", "Укажите минералогию и известные упорные компоненты матрицы.", "Если нужен анализ ртути или золота, согласуйте отдельную или дополнительную схему.", "Масса аналитической навески не равна массе отправляемого образца: необходимый объём материала уточните заранее."],
      result: "Многоэлементные данные с указанием выбранного пакета и способа разложения для корректной интерпретации результата.",
      note: "Четырёхкислотное разложение не рекомендуется как основной метод для золота. Для ртути также требуется учесть возможные потери при подготовке и согласовать подходящую схему.",
      faq: [["Царская водка даёт полное содержание элемента?", "Для многих матриц результат отражает извлекаемую часть. Полнота разложения зависит от минералогии и конкретного элемента."], ["Когда нужно сплавление?", "Когда для целевых элементов важно более полное разложение упорных минералов. Необходимость определяют по матрице и аналитической задаче."], ["Можно ли анализировать технологические растворы и уголь?", "Да, для таких материалов предусмотрены специальные схемы. Укажите состав материала, целевые элементы и ожидаемые концентрации."]]
    },
    kg: {
      lead: "Геологиялык чалгындоо жана технологиялык материалдар үчүн ICP-MS жана ICP-AES көп элементтүү пакеттери. Ажыратуу ыкмасы жыйынтык элементтин кайсы бөлүгүн көрсөтөрүн аныктайт.",
      overviewTitle: "Минералогияга жараша ажыратуу ыкмасын тандоо",
      overview: ["Материалдын түрү, максаттуу жана индикатор элементтер талдоо схемасын аныктайт. SAEL ICP-MS жана ICP-AES менен 46 элементке арналган ультраиз пакеттерин, ошондой эле ICP-AES менен 35 элементке арналган из пакеттерин сунуштайт.", "Көпчүлүк геологиялык матрицаларда падыша арагы менен алынган жыйынтык элементтин эриген бөлүгүн мүнөздөйт. Төрт кислота менен ажыратуу толукка жакын, бирок кыйын эрүүчү минералдар үчүн балкытуу талап кылынышы мүмкүн. Пакет тандоодо бул чектөөлөр эске алынат."],
      facts: [["46 элемент", "ультраиз пакеттери"], ["35 элемент", "ICP-AES из пакеттери"], ["1 гдан", "сүрөттөлгөн пакеттердин аналитикалык навескасы"]],
      methodsTitle: "Ажыратуу жана өлчөө ыкмалары",
      methods: [
        {title:"Падыша арагы · ICP-MS / ICP-AES", text:"Керн жана тоо тектериндеги элементтерди ультраиз деңгээлде аныктоо үчүн. Көптөгөн сульфиддерди, оксиддерди жана карбонаттарды жакшы эритет, бирок силикаттарды жана кыйын эрүүчү оксиддерди толук эритпейт."},
        {title:"Төрт кислота · ICP-MS / ICP-AES", text:"Геологиялык материалдардын көпчүлүк минералдарын эритет. Барит жана сейрек жер элементтеринин, калайдын, вольфрамдын айрым туруктуу минералдары үчүн башка даярдоо талап кылынышы мүмкүн."},
        {title:"ICP-AES из пакеттери", text:"35 элементтүү пакеттер падыша арагы жана төрт кислота менен ажыратуу варианттарында бар. Төмөн камтуудагы минералдашкан материалдар үчүн өзүнчө схемалар да каралган."},
        {title:"Литий бораты менен балкытуу", text:"Балкытуу, кислотада эритүү жана ICP-MS элементтердин кеңири спектрин, анын ичинде кыйын эрүүчү минералдардагы элементтерди толугураак аныктоо үчүн колдонулат."},
        {title:"Технологиялык материалдар", text:"Концентраттар, көмүр, Доре жана эритмелер үчүн өзүнчө схемалар колдонулат. Доре кеминде эки дубликатта пробирдик талдоо менен, кошулмалар падыша арагынан кийин ICP-AES менен аныкталат; өндүрүш эритмелери ICP-AES менен изилденет."},
        {title:"Технологиялык материалдардын навескалары", text:"Көмүр үчүн химиялык талдоого 5 г, сыноого 100 г; концентраттарга 50 г, Дореге 1 г көрсөтүлгөн. Концентраттарды талдоо металлургиялык сыноолорду жана бөлүп алууну оптималдаштырууну колдойт. Жөнөтүлүүчү масса өзүнчө макулдашылат."}
      ],
      sampleTags: ["Керн жана тоо тектери", "Руда", "Концентраттар", "Активдештирилген көмүр", "Доре куймалары", "Өндүрүш эритмелери"],
      requirements: ["Элементтердин тизмесин, күтүлгөн диапазондорду жана изилдөөнүн максатын бериңиз.", "Минералогияны жана матрицадагы белгилүү туруктуу компоненттерди көрсөтүңүз.", "Сымап же алтын керек болсо өзүнчө же кошумча схеманы макулдашыңыз.", "Аналитикалык навеска жөнөтүлүүчү үлгүнүн массасына барабар эмес: керектүү материал көлөмүн алдын ала тактаңыз."],
      result: "Жыйынтыкты туура чечмелөө үчүн тандалган пакет жана ажыратуу ыкмасы көрсөтүлгөн көп элементтүү маалыматтар.",
      note: "Төрт кислота менен ажыратуу алтын үчүн негизги ыкма катары сунушталбайт. Сымап үчүн даярдоодогу мүмкүн болгон жоготуулар эске алынып, ылайыктуу схема макулдашылышы керек.",
      faq: [["Падыша арагы элементтин жалпы камтуусун береби?", "Көп матрицаларда жыйынтык эриген бөлүктү көрсөтөт. Ажыратуунун толуктугу минералогияга жана конкреттүү элементке жараша болот."], ["Балкытуу качан керек?", "Максаттуу элементтер үчүн туруктуу минералдарды толугураак ажыратуу маанилүү болгондо. Керектүүлүк матрицага жана тапшырмага жараша аныкталат."], ["Технологиялык эритмелерди жана көмүрдү талдоого болобу?", "Ооба, мындай материалдар үчүн атайын схемалар бар. Курамын, максаттуу элементтерди жана күтүлгөн концентрацияларды көрсөтүңүз."]]
    },
    en: {
      lead: "ICP-MS and ICP-AES multi-element packages for exploration and process materials. The digestion determines which fraction of an element the result represents.",
      overviewTitle: "Choose the digestion to match the mineralogy",
      overview: ["Material type, target elements and pathfinder elements guide method selection. SAEL offers 46-element ultra-trace packages using ICP-MS and ICP-AES, and 35-element trace packages using ICP-AES.", "For many geological matrices, aqua regia results represent the extractable fraction. Four-acid digestion is near-total, but resistant minerals may require fusion. These limitations matter when selecting a package."],
      facts: [["46 elements", "ultra-trace packages"], ["35 elements", "ICP-AES trace packages"], ["from 1 g", "analytical charge for described packages"]],
      methodsTitle: "Digestion and measurement methods",
      methods: [
        {title:"Aqua regia · ICP-MS / ICP-AES", text:"For ultra-trace elements in core and rock. It effectively extracts many sulphides, oxides and carbonates, but does not fully dissolve silicates and resistant oxides."},
        {title:"Four acids · ICP-MS / ICP-AES", text:"Dissolves most minerals in geological materials. Barite and some resistant rare-earth, tin and tungsten minerals may require another preparation route."},
        {title:"ICP-AES trace packages", text:"35-element packages are available with aqua regia and four-acid digestion. Separate analytical schemes also address low-grade mineralized materials."},
        {title:"Lithium borate fusion", text:"Fusion followed by acid dissolution and ICP-MS supports more complete determination of a broad element range, including elements hosted in resistant minerals."},
        {title:"Process materials", text:"Dedicated schemes address concentrates, carbon, doré and solutions. Doré uses fire assay on at least two duplicates; impurities use ICP-AES after aqua regia. Process solutions are measured by ICP-AES."},
        {title:"Process material charges", text:"Stated minimums are 5 g for carbon chemistry and 100 g for carbon testing, 50 g for concentrates and 1 g for doré. Concentrate analysis supports metallurgical tests and recovery optimization. Shipment mass is agreed separately."}
      ],
      sampleTags: ["Core and rock", "Ore", "Concentrates", "Activated carbon", "Doré bullion", "Process solutions"],
      requirements: ["Provide target elements, expected ranges and the purpose of the work.", "Describe mineralogy and known resistant components of the matrix.", "Agree a separate or additional scheme if mercury or gold is required.", "The analytical charge is not the shipment mass: confirm the amount of material to submit in advance."],
      result: "Multi-element data identifying the selected package and digestion, supporting correct interpretation of the result.",
      note: "Four-acid digestion is not recommended as the primary gold method. Mercury requires consideration of potential preparation losses and an agreed analytical route.",
      faq: [["Does aqua regia give a total concentration?", "For many matrices it measures the extractable fraction. Digestion completeness depends on mineralogy and the individual element."], ["When is fusion needed?", "When more complete decomposition of resistant minerals matters for the target elements. The matrix and analytical objective guide the decision."], ["Can process solutions and carbon be analyzed?", "Yes, dedicated schemes address these materials. Provide the composition, target elements and expected concentrations."]]
    }
  },
  metallurgy: {
    sourceUrl: "https://sael.kg/ru/services/metallurgy/",
    ru: {
      lead: "Лабораторные программы для оценки извлечения и выбора технологических параметров: бутылочное и колонное выщелачивание, гравитационное концентрирование и флотация.",
      overviewTitle: "Испытания, которые помогают выбрать дальнейшую программу",
      overview: ["Начальный тест позволяет оценить наличие цианируемого золота и определить, какие исследования нужны дальше. Программа формируется под руду и цель проекта: от первичной оценки до изучения влияния крупности, концентрации реагента и природных сорбентов.", "Лабораторная база включает бутылочные агитаторы, колонны для перколяционного выщелачивания, концентратор Knelson и флотационное оборудование Svedala. Объём материала и подготовку согласуют до отправки."],
      facts: [["BR", "программы бутылочного выщелачивания"], ["обычно 72 ч", "продолжительность начального теста"], ["от 100 г", "навеска для бутылочного теста"]],
      methodsTitle: "Направления испытаний",
      methods: [
        {title:"Бутылочное выщелачивание", text:"Исследование цианируемости с анализом растворов на золото. Начальный тест обычно длится 72 часа; длительность может быть изменена под программу. Это продолжительность опыта, а не срок выдачи отчёта."},
        {title:"Крупность и распределение золота", text:"Первичный тест рекомендуется проводить на перемешанной пульпе с 90% материала мельче 0,075 мм. Ситовой анализ помогает оценивать распределение и извлечение золота по классам крупности."},
        {title:"Расширенная программа BR", text:"Может включать подготовку руды, физические свойства, первичную оценку выщелачивания, влияние крупности и концентрации NaCN, а также исследование эффекта Preg Robbing."},
        {title:"Колонное выщелачивание", text:"Перколяционные тесты включают подготовку пробы и выщелачивание в колонне. Объём и крупность материала, режим и программа наблюдений определяются для проекта."},
        {title:"Гравитация и флотация", text:"Гравитационное концентрирование на Knelson и флотационные тесты на лабораторном оборудовании Svedala включаются в согласованную программу технологических исследований."}
      ],
      sampleTags: ["Руды", "Материал для колонных тестов", "Подготовленные пульпы", "Технологические продукты"],
      requirements: ["Опишите руду, минералогию, предполагаемый процесс и цель испытаний.", "Передайте имеющиеся анализы и сведения о подготовке материала.", "Согласуйте общую массу, крупность и число опытов — 100 г относится только к отдельной навеске бутылочного теста.", "Утвердите программу, перечень анализов, отчётность и срок до начала работ."],
      result: "Результаты согласованной программы испытаний и аналитических измерений для оценки извлечения и технологических параметров.",
      note: "Цена, общая масса материала и срок определяются после согласования программы. Указанные 72 часа относятся к типичному отдельному опыту.",
      faq: [["Можно ли начать с небольшого теста?", "Первичная бутылочная проба помогает оценить цианируемость золота и выбрать дальнейшие этапы. Состав начального исследования согласует лаборатория."], ["Можно ли использовать пульпы после пробирного анализа?", "Для начального теста можно использовать те же подготовленные пульпы. Остаточную массу и пригодность материала нужно подтвердить."], ["Как рассчитывается стоимость?", "По согласованной программе: подготовке, числу и длительности опытов, аналитическому сопровождению и составу отчёта."]]
    },
    kg: {
      lead: "Бөлүп алууну баалоо жана технологиялык параметрлерди тандоо үчүн лабораториялык программалар: бөтөлкө жана колонкада эритүү, гравитациялык байытуу жана флотация.",
      overviewTitle: "Кийинки программаны тандоого жардам берген сыноолор",
      overview: ["Баштапкы тест цианидде эрүүчү алтындын бар экенин баалап, кийинки изилдөөлөрдү тандоого жардам берет. Программа рудага жана долбоордун максатына ылайык түзүлөт: алгачкы баалоодон тартып майдалыктын, реагент концентрациясынын жана табигый сорбенттердин таасирине чейин.", "Лабораториялык базага бөтөлкө агитаторлору, перколяциялык эритүү колонкалары, Knelson концентратору жана Svedala флотация жабдуулары кирет. Материалдын көлөмү жана даярдалышы жөнөтүүдөн мурда макулдашылат."],
      facts: [["BR", "бөтөлкөдө эритүү программалары"], ["адатта 72 саат", "баштапкы тесттин узактыгы"], ["100 гдан", "бөтөлкө тести үчүн навеска"]],
      methodsTitle: "Сыноолордун багыттары",
      methods: [
        {title:"Бөтөлкөдө эритүү", text:"Эритмелердеги алтынды талдоо менен цианидде эригичтикти изилдөө. Баштапкы тест адатта 72 саатка созулат; узактыгы программага жараша өзгөрүшү мүмкүн. Бул отчет берүү мөөнөтү эмес, тажрыйбанын узактыгы."},
        {title:"Майдалык жана алтындын таралышы", text:"Алгачкы тестти 90% бөлүгү 0,075 ммден майда аралаштырылган пульпада жүргүзүү сунушталат. Ситалык талдоо алтындын өлчөм класстары боюнча таралышын жана бөлүнүп алынышын баалоого жардам берет."},
        {title:"Кеңейтилген BR программасы", text:"Руданы даярдоону, физикалык касиеттерин, эритүүнү баштапкы баалоону, майдалыктын жана NaCN концентрациясынын таасирин, ошондой эле Preg Robbing эффектин изилдөөнү камтышы мүмкүн."},
        {title:"Колонкада эритүү", text:"Перколяциялык тесттер үлгүнү даярдоону жана колонкада эритүүнү камтыйт. Материалдын көлөмү, майдалыгы, режим жана байкоо программасы долбоор үчүн аныкталат."},
        {title:"Гравитация жана флотация", text:"Knelson менен гравитациялык байытуу жана Svedala лабораториялык жабдуусунда флотациялык тесттер макулдашылган технологиялык изилдөө программасына киргизилет."}
      ],
      sampleTags: ["Руда", "Колонка тесттерине материал", "Даяр пульпалар", "Технологиялык продуктулар"],
      requirements: ["Руданы, минералогияны, күтүлгөн процессти жана сыноонун максатын сүрөттөңүз.", "Бар болгон талдоолорду жана материалдын даярдалышы тууралуу маалыматты бериңиз.", "Жалпы массаны, майдалыкты жана тажрыйбалардын санын макулдашыңыз: 100 г өзүнчө бөтөлкө тестинин навескасына гана тиешелүү.", "Иш башталганга чейин программаны, талдоолорду, отчеттуулукту жана мөөнөттү бекитиңиз."],
      result: "Бөлүп алууну жана технологиялык параметрлерди баалоо үчүн макулдашылган сыноо программасынын жана аналитикалык өлчөөлөрдүн жыйынтыктары.",
      note: "Баасы, материалдын жалпы массасы жана мөөнөт программа макулдашылгандан кийин аныкталат. 72 саат типтүү өзүнчө тажрыйбага тиешелүү.",
      faq: [["Чакан тесттен баштаса болобу?", "Баштапкы бөтөлкө тести алтындын цианидде эригичтигин баалап, кийинки этаптарды тандоого жардам берет. Алгачкы изилдөөнүн курамын лаборатория макулдашат."], ["Пробирдик талдоодон кийинки пульпаны колдонсо болобу?", "SAEL баштапкы тестке ошол эле даяр пульпаларды колдонууга жол берет. Калган массаны жана материалдын жарактуулугун ырастоо керек."], ["Баасы кантип эсептелет?", "Макулдашылган программа боюнча: даярдоо, тажрыйбалардын саны жана узактыгы, аналитикалык коштоо жана отчеттун курамы эске алынат."]]
    },
    en: {
      lead: "Laboratory programs to assess recovery and process parameters: bottle-roll and column leaching, gravity concentration and flotation.",
      overviewTitle: "Tests that guide the next stage of investigation",
      overview: ["An initial test helps assess cyanide-extractable gold and select further work. Programs are designed around the ore and objective, from initial evaluation to the effects of particle size, reagent concentration and natural gold sorbents.", "The laboratory has bottle agitators, percolation leach columns, a Knelson concentrator and Svedala flotation equipment. Material quantity and preparation are agreed before shipment."],
      facts: [["BR", "bottle-roll leach programs"], ["typically 72 h", "initial test duration"], ["from 100 g", "charge for a bottle-roll test"]],
      methodsTitle: "Testing capabilities",
      methods: [
        {title:"Bottle-roll leaching", text:"Cyanide amenability testing with gold analysis of the resulting solutions. An initial test typically lasts 72 hours; the duration can change with the program. This is test duration, not report turnaround."},
        {title:"Particle size and gold distribution", text:"An initial test is recommended on a blended pulp with 90% passing 0.075 mm. Screen analysis helps assess gold distribution and recovery by size fraction."},
        {title:"Extended BR program", text:"May include ore preparation, physical properties, initial leach assessment, effects of particle size and NaCN concentration, and investigation of preg-robbing behavior."},
        {title:"Column leaching", text:"Percolation tests include sample preparation and column leaching. Material quantity, particle size, operating conditions and monitoring are set for the project."},
        {title:"Gravity and flotation", text:"Knelson gravity concentration and flotation tests using Svedala laboratory equipment can form part of the agreed metallurgical program."}
      ],
      sampleTags: ["Ore", "Column-test material", "Prepared pulps", "Process products"],
      requirements: ["Describe the ore, mineralogy, proposed process and testing objective.", "Provide existing analyses and preparation information.", "Agree total mass, particle size and number of tests: 100 g refers only to an individual bottle-roll charge.", "Approve the program, supporting analyses, reporting and turnaround before work begins."],
      result: "Results from the agreed tests and supporting analyses to assess recovery and metallurgical parameters.",
      note: "Price, total material mass and turnaround are set after program approval. The stated 72 hours refers to a typical individual test.",
      faq: [["Can we start with a small test?", "An initial bottle-roll test helps assess gold cyanide amenability and select subsequent stages. The laboratory agrees the initial scope."], ["Can pulps from fire assay preparation be used?", "The same prepared pulps can be used for an initial test. Remaining mass and material suitability need confirmation."], ["How is the program priced?", "According to the agreed preparation, number and duration of tests, analytical support and reporting scope."]]
    }
  },
  environment: {
    sourceUrl: "https://sael.kg/ru/services/environment/",
    ru: {
      lead: "Исследования воды, почв, пыли и других материалов для экологического мониторинга на стадиях разведки, добычи и рекультивации.",
      overviewTitle: "Аналитические данные для экологической программы",
      overview: ["SAEL выполняет экологические исследования для горнодобывающей промышленности. Программа объединяет нужные показатели, материал и подходящий метод — от классической мокрой химии до инструментального многоэлементного анализа.", "Отдельные направления включают определение урана, анализ биологических материалов и статические испытания для оценки потенциала кислотного дренажа. Состав исследования согласуют с задачей мониторинга и характеристиками образца."],
      facts: [["Вода · почва", "материалы экологического мониторинга"], ["ICP-MS · ICP-AES", "инструментальный анализ элементов"], ["ABA · NAG", "статические испытания ARD"]],
      methodsTitle: "Объекты и аналитические подходы",
      methods: [
        {title:"Вода", text:"Выбор показателей может включать физико-химические параметры, ионы и металлы. Для программы применяются методы мокрой химии, ICP-AES, ICP-MS и ионной хроматографии."},
        {title:"Почвы и пыль на фильтрах", text:"Исследования поддерживают оценку состояния окружающей среды и промышленный мониторинг. Перечень показателей и подготовку выбирают по типу материала."},
        {title:"Кислотный дренаж", text:"Для прогнозирования ARD предусмотрены статические тесты ABA и NAG. Они включаются в программу оценки свойств материала по согласованному заданию."},
        {title:"Уран", text:"Для определения урана согласуют материал, ожидаемую концентрацию и аналитический пакет. Необходимые условия подготовки зависят от матрицы."},
        {title:"Биологические материалы", text:"Растительность, ткани животных, кровь, моча, волосы и ногти рассматриваются по отдельной программе. Приём конкретного материала и упаковку согласуют заранее."}
      ],
      sampleTags: ["Вода", "Почва", "Пыль на фильтрах", "Растительность", "Биологические материалы"],
      requirements: ["Укажите объект, место и цель отбора, необходимые показатели и ожидаемые концентрации.", "Для воды до отбора согласуйте тару, объём, консервацию, условия и срок доставки.", "Для почв и фильтров уточните массу, упаковку и подготовку.", "Отдельно согласуйте приём биологических материалов и сопроводительную информацию."],
      result: "Результаты по согласованным экологическим показателям и материалам с указанием применённой аналитической схемы.",
      note: "Условия отбора и хранения зависят от показателя. Получите инструкции лаборатории до отбора, чтобы согласовать весь путь образца.",
      faq: [["Можно ли заказать отдельные показатели вместо пакета?", "Передайте список показателей и материал. Лаборатория уточнит подходящий состав работ и расчёт стоимости."], ["Какую тару использовать для воды?", "Тип тары и консервация зависят от определяемого вещества. Согласуйте инструкции до отбора и отправки."], ["Что нужно для программы ABA/NAG?", "Опишите материал, задачу оценки кислотного дренажа и доступное количество пробы. Программа и подготовка согласуются до начала работ."]]
    },
    kg: {
      lead: "Чалгындоо, казып алуу жана рекультивация этаптарындагы экологиялык мониторинг үчүн сууну, топуракты, чаңды жана башка материалдарды изилдөө.",
      overviewTitle: "Экологиялык программа үчүн аналитикалык маалыматтар",
      overview: ["SAEL тоо-кен өнөр жайы үчүн экологиялык изилдөөлөрдү аткарат. Программа керектүү көрсөткүчтөрдү, материалды жана ылайыктуу ыкманы бириктирет: классикалык нымдуу химиядан инструменталдык көп элементтүү талдоого чейин.", "Өзүнчө багыттарга уранды аныктоо, биологиялык материалдарды талдоо жана кислоталык дренаждын потенциалын баалоочу статикалык сыноолор кирет. Изилдөөнүн курамы мониторингдин тапшырмасына жана үлгүнүн мүнөздөмөлөрүнө ылайык макулдашылат."],
      facts: [["Суу · топурак", "экологиялык мониторинг материалдары"], ["ICP-MS · ICP-AES", "элементтерди инструменталдык талдоо"], ["ABA · NAG", "ARD статикалык сыноолору"]],
      methodsTitle: "Объекттер жана аналитикалык ыкмалар",
      methods: [
        {title:"Суу", text:"Көрсөткүчтөргө физикалык-химиялык параметрлер, иондор жана металлдар кириши мүмкүн. Программада нымдуу химия, ICP-AES, ICP-MS жана иондук хроматография колдонулат."},
        {title:"Топурак жана фильтрлердеги чаң", text:"Изилдөөлөр айлана-чөйрөнүн абалын баалоону жана өндүрүштүк мониторингди колдойт. Көрсөткүчтөр жана даярдоо материалдын түрүнө жараша тандалат."},
        {title:"Кислоталык дренаж", text:"ARDни болжолдоо үчүн ABA жана NAG статикалык тесттери каралган. Алар макулдашылган тапшырма боюнча материалдын касиеттерин баалоо программасына киргизилет."},
        {title:"Уран", text:"Уранды аныктоо үчүн материал, күтүлгөн концентрация жана аналитикалык пакет макулдашылат. Даярдоо шарттары матрицага жараша болот."},
        {title:"Биологиялык материалдар", text:"Өсүмдүктөр, жаныбарлардын ткандары, кан, заара, чач жана тырмак өзүнчө программа боюнча каралат. Конкреттүү материалды кабыл алуу жана таңгак алдын ала макулдашылат."}
      ],
      sampleTags: ["Суу", "Топурак", "Фильтрлердеги чаң", "Өсүмдүктөр", "Биологиялык материалдар"],
      requirements: ["Объектти, үлгү алуу жерин жана максатын, көрсөткүчтөрдү жана күтүлгөн концентрацияларды көрсөтүңүз.", "Суу үчүн үлгү алууга чейин идишти, көлөмдү, консервацияны, жеткирүү шарттарын жана мөөнөтүн макулдашыңыз.", "Топурак жана фильтрлер үчүн массаны, таңгакты жана даярдоону тактаңыз.", "Биологиялык материалдарды кабыл алууну жана коштоочу маалыматты өзүнчө макулдашыңыз."],
      result: "Колдонулган талдоо схемасы көрсөтүлгөн макулдашылган экологиялык көрсөткүчтөр жана материалдар боюнча жыйынтыктар.",
      note: "Үлгү алуу жана сактоо шарттары көрсөткүчкө жараша болот. Үлгүнүн бардык жолун макулдашуу үчүн лабораториянын нускамасын үлгү алууга чейин алыңыз.",
      faq: [["Пакеттин ордуна айрым көрсөткүчтөрдү заказ кылса болобу?", "Көрсөткүчтөрдүн тизмесин жана материалды бериңиз. Лаборатория иштин ылайыктуу курамын жана баасын тактайт."], ["Суу үчүн кандай идиш керек?", "Идиштин түрү жана консервация аныкталуучу затка жараша болот. Үлгү алуу жана жөнөтүүгө чейин нускаманы макулдашыңыз."], ["ABA/NAG программасы үчүн эмне керек?", "Материалды, кислоталык дренажды баалоонун тапшырмасын жана үлгүнүн жеткиликтүү көлөмүн сүрөттөңүз. Программа жана даярдоо иш башталганга чейин макулдашылат."]]
    },
    en: {
      lead: "Water, soil, dust and other material testing for environmental monitoring during exploration, mining and rehabilitation.",
      overviewTitle: "Analytical data for your environmental program",
      overview: ["SAEL provides environmental testing for the mining industry. Programs match the required analytes, material and method, from classical wet chemistry to instrumental multi-element analysis.", "Dedicated areas include uranium determination, biological materials and static tests for acid rock drainage potential. The scope is agreed around the monitoring objective and sample characteristics."],
      facts: [["Water · soil", "environmental monitoring materials"], ["ICP-MS · ICP-AES", "instrumental elemental analysis"], ["ABA · NAG", "static ARD testing"]],
      methodsTitle: "Materials and analytical approaches",
      methods: [
        {title:"Water", text:"Programs may include physicochemical parameters, ions and metals. Methods include wet chemistry, ICP-AES, ICP-MS and ion chromatography."},
        {title:"Soils and dust on filters", text:"Testing supports environmental assessment and industrial monitoring. The analyte suite and preparation depend on the material."},
        {title:"Acid rock drainage", text:"Static ABA and NAG tests are available for ARD prediction. They form part of a material assessment program under an agreed specification."},
        {title:"Uranium", text:"The material, expected concentration and analytical package are agreed for uranium determination. Preparation requirements depend on the matrix."},
        {title:"Biological materials", text:"Vegetation, animal tissues, blood, urine, hair and nails are considered under a dedicated program. Acceptance of a specific material and packaging are agreed in advance."}
      ],
      sampleTags: ["Water", "Soil", "Dust on filters", "Vegetation", "Biological materials"],
      requirements: ["Specify the sampling object, location, objective, required analytes and expected concentrations.", "For water, agree containers, volume, preservation, delivery conditions and timing before sampling.", "For soils and filters, confirm mass, packaging and preparation.", "Agree biological material acceptance and accompanying information separately."],
      result: "Results for the agreed environmental parameters and materials, identifying the analytical scheme used.",
      note: "Sampling and storage requirements depend on the analyte. Obtain laboratory instructions before sampling so the complete sample route can be agreed.",
      faq: [["Can individual analytes be requested instead of a package?", "Provide the analyte list and material. The laboratory will define an appropriate scope and quotation."], ["Which water container should I use?", "Container type and preservation depend on the substance being measured. Agree instructions before sampling and shipping."], ["What is needed for an ABA/NAG program?", "Describe the material, ARD assessment objective and available sample quantity. Program and preparation are agreed before work starts."]]
    }
  },
  inspection: {
    sourceUrl: "https://sael.kg/ru/services/inspection/",
    ru: {
      lead: "Инспекция отгрузки и приёмки руд и продуктов переработки: от отбора и подготовки проб до определения влажности, химического анализа и оформления документов.",
      overviewTitle: "Согласованная программа контроля партии",
      overview: ["SAEL проводит инспекцию готовой продукции при отгрузке и приёмке грузов. Работы могут объединять отбор проб для химического анализа, пробоподготовку, определение влажности руд и концентратов и анализ драгоценных металлов.", "До начала работ необходимо определить объект и границы задания: партию, место, дату, схему отбора, требуемые показатели и документы. Это связывает действия на объекте с последующей лабораторной частью."],
      facts: [["Отгрузка · приёмка", "этапы инспекции"], ["Руда · концентрат", "основные объекты контроля"], ["Отбор → анализ", "согласованная цепочка работ"]],
      methodsTitle: "Что может включать инспекция",
      methods: [
        {title:"Контроль отгрузки и приёмки", text:"Инспекционные работы с рудами и продуктами их переработки выполняются по согласованной задаче и программе контроля партии."},
        {title:"Отбор и подготовка проб", text:"Отобранный материал готовится для химических исследований. Схема отбора, количество и масса проб определяются до проведения работ."},
        {title:"Влажность и химический состав", text:"Программа может включать определение влажности руд и концентратов, а также испытания на содержание драгоценных металлов."},
        {title:"Отбор воды, почвы и угля", text:"Программа отбора может учитывать ГОСТ 31861 для воды, ГОСТ Р 58595-2019 для почв и ГОСТ Р ИСО 18283-2010 для угля и кокса. Применимый стандарт согласуют для объекта."},
        {title:"Документирование", text:"Оформление инспекционных и аналитических документов входит в согласованный объём. Заранее уточняются состав отчётности и сведения, которые должны быть зафиксированы."}
      ],
      sampleTags: ["Руды", "Концентраты", "Продукты переработки", "Вода", "Почва", "Уголь и кокс"],
      requirements: ["Укажите объект, размер партии, место и плановую дату работ.", "Опишите цель инспекции, показатели и требования заинтересованных сторон.", "Согласуйте схему отбора, массу, число проб и применимые стандарты.", "Передайте сведения об условиях доступа и необходимом комплекте документов."],
      result: "Инспекционные и аналитические документы по программе и в объёме, согласованных до начала работ.",
      note: "Стоимость инспекции рассчитывается по объекту, месту проведения, объёму отбора и аналитической программе.",
      faq: [["Можно ли объединить инспекцию и лабораторный анализ?", "Да. Задание может включать отбор, подготовку, определение влажности и химические испытания. Конкретный состав фиксируется в программе."], ["Какие данные нужны для расчёта?", "Место и дата, материал и размер партии, схема отбора, показатели, требуемая отчётность и условия доступа на объект."], ["Какой стандарт будет использован?", "Он зависит от материала и задачи. Укажите договорные или нормативные требования, чтобы согласовать применимую программу до выезда."]]
    },
    kg: {
      lead: "Руда жана кайра иштетүү продуктуларын жөнөтүүдө жана кабыл алууда инспекциялоо: үлгү алуу жана даярдоодон тартып нымдуулукту, химиялык курамды аныктоого жана документтерди тариздөөгө чейин.",
      overviewTitle: "Партияны контролдоонун макулдашылган программасы",
      overview: ["SAEL жүктөрдү жөнөтүүдө жана кабыл алууда даяр продукцияны инспекциялайт. Иштер химиялык талдоо үчүн үлгү алууну, даярдоону, руданын жана концентраттын нымдуулугун, баалуу металлдарды аныктоону бириктириши мүмкүн.", "Иш башталганга чейин объект жана тапшырманын чеги аныкталат: партия, жер, дата, үлгү алуу схемасы, көрсөткүчтөр жана документтер. Бул объекттеги иштерди кийинки лабораториялык этап менен байланыштырат."],
      facts: [["Жөнөтүү · кабыл алуу", "инспекциянын этаптары"], ["Руда · концентрат", "негизги контролдоо объекттери"], ["Үлгү алуу → талдоо", "иштердин макулдашылган чынжыры"]],
      methodsTitle: "Инспекция эмнелерди камтышы мүмкүн",
      methods: [
        {title:"Жөнөтүүнү жана кабыл алууну контролдоо", text:"Руда жана аны кайра иштетүү продуктулары боюнча инспекциялык иштер партияны контролдоонун макулдашылган тапшырмасы жана программасы менен аткарылат."},
        {title:"Үлгү алуу жана даярдоо", text:"Алынган материал химиялык изилдөөлөргө даярдалат. Үлгү алуу схемасы, саны жана массасы ишке чейин аныкталат."},
        {title:"Нымдуулук жана химиялык курам", text:"Программа руда жана концентраттын нымдуулугун, ошондой эле баалуу металлдардын камтуусун аныктоону камтышы мүмкүн."},
        {title:"Суудан, топурактан жана көмүрдөн үлгү алуу", text:"Суу үчүн ГОСТ 31861, топурак үчүн ГОСТ Р 58595-2019, көмүр жана кокс үчүн ГОСТ Р ИСО 18283-2010 көрсөтүлгөн. Колдонулуучу стандарт жана программа конкреттүү объект үчүн макулдашылат."},
        {title:"Документтештирүү", text:"Инспекциялык жана аналитикалык документтерди тариздөө макулдашылган көлөмгө кирет. Отчеттун курамы жана катталуучу маалымат алдын ала такталат."}
      ],
      sampleTags: ["Руда", "Концентраттар", "Кайра иштетүү продуктулары", "Суу", "Топурак", "Көмүр жана кокс"],
      requirements: ["Объектти, партиянын көлөмүн, жерди жана пландалган датаны көрсөтүңүз.", "Инспекциянын максатын, көрсөткүчтөрдү жана кызыкдар тараптардын талаптарын сүрөттөңүз.", "Үлгү алуу схемасын, массаны, санын жана колдонулуучу стандарттарды макулдашыңыз.", "Объектке кирүү шарттары жана керектүү документтер тууралуу маалымат бериңиз."],
      result: "Иш башталганга чейин макулдашылган программа жана көлөм боюнча инспекциялык жана аналитикалык документтер.",
      note: "Инспекциянын баасы объектке, өткөрүү жерине, үлгү алуу көлөмүнө жана аналитикалык программага жараша эсептелет.",
      faq: [["Инспекцияны жана лабораториялык талдоону бириктирсе болобу?", "Ооба. Тапшырма үлгү алууну, даярдоону, нымдуулукту аныктоону жана химиялык сыноолорду камтышы мүмкүн. Так курам программада белгиленет."], ["Эсептөө үчүн кандай маалымат керек?", "Жер жана дата, материал жана партиянын көлөмү, үлгү алуу схемасы, көрсөткүчтөр, талап кылынган отчет жана объектке кирүү шарттары."], ["Кайсы стандарт колдонулат?", "Ал материалга жана тапшырмага жараша болот. Барууга чейин программаны макулдашуу үчүн келишимдик же нормативдик талаптарды көрсөтүңүз."]]
    },
    en: {
      lead: "Shipment and receipt inspection of ores and process products: from sampling and preparation to moisture determination, chemical analysis and documentation.",
      overviewTitle: "An agreed control program for the lot",
      overview: ["SAEL provides finished-product inspection at shipment and receipt. The scope can combine sampling for chemical analysis, preparation, moisture determination in ores and concentrates, and precious metal assays.", "Before work begins, define the object and scope: lot, location, date, sampling plan, required measurements and documents. This connects on-site work with the subsequent laboratory stage."],
      facts: [["Shipment · receipt", "inspection stages"], ["Ore · concentrate", "principal inspection materials"], ["Sampling → analysis", "an agreed sequence of work"]],
      methodsTitle: "What an inspection can include",
      methods: [
        {title:"Shipment and receipt control", text:"Inspection of ores and process products follows an agreed specification and lot control program."},
        {title:"Sampling and preparation", text:"Collected material is prepared for chemical testing. Sampling scheme, number of samples and mass are established before work begins."},
        {title:"Moisture and chemical composition", text:"The scope can include ore and concentrate moisture determination and precious metal testing."},
        {title:"Water, soil and coal sampling", text:"Sampling programs can refer to GOST 31861 for water, GOST R 58595-2019 for soils and GOST R ISO 18283-2010 for coal and coke. The applicable standard and program are agreed for the specific object."},
        {title:"Documentation", text:"Inspection and analytical documents form part of the agreed scope. The reporting package and information to record are confirmed in advance."}
      ],
      sampleTags: ["Ore", "Concentrates", "Process products", "Water", "Soil", "Coal and coke"],
      requirements: ["Specify the object, lot size, location and planned date.", "Describe the inspection objective, measurements and stakeholder requirements.", "Agree the sampling scheme, mass, sample count and applicable standards.", "Provide site access requirements and the required documentation package."],
      result: "Inspection and analytical documentation under the program and scope agreed before work starts.",
      note: "Inspection pricing depends on the object, location, sampling scope and analytical program.",
      faq: [["Can inspection and laboratory analysis be combined?", "Yes. The specification can include sampling, preparation, moisture determination and chemical testing. The specific scope is fixed in the program."], ["What information is needed for a quote?", "Location and date, material and lot size, sampling scheme, measurements, reporting requirements and site access conditions."], ["Which standard will be used?", "It depends on the material and objective. Provide contractual or regulatory requirements so the program can be agreed before the visit."]]
    }
  }
};

