# Category Mapping for Bank Transactions
# This file maps merchant names to expense categories

CATEGORY_MAPPING = {
    # ===========================================
    # ALIMENTACIÓN (Restaurantes, Cafeterías, Comida)
    # ===========================================
    "Alimentación": [
        # Restaurantes
        "CREPES Y WAFFLES", "CREPES Y WAFFLES WTC", "Crepes & Waffles", "Crepes y Waffles", "Crepes y Waffles WTC",
        "R06 CREPESYWAFFLES WTC", "R28 CREPESYWAFFLES USA", "R34 CREPESYWAFFLES ATL",
        "HAMBURGUESAS EL CORR", "HAMBURGUESAS EL CORRAL", "Hamburguesas El Corral", "KIOSKO EL CORRAL",
        "EL CORRAL GOURMET SALI", "EL CORRAL GREEN OFFICE", "BURGER BAR BY EL CORRA",
        "MC DONALD S", "WENDY S", "DOMINO S PIZZA", "PICARA PIZZA",
        "AUNTIE ANNE S", "RANDY S",
        "OSK PERU COCINA NIKKEI", "OSAKI 93", "OSAKI USAQUEN", "Osaki Chía",
        "KO ASIAN KITCHEN UNICE", "IZAKAYA ZONA T 3P", "MASTER WOK - ROCKINGHA",
        "SIPOTE BURRITO SALITRE", "CUMBIA HOUSE", "CHONA HOUSE",
        "RESTAURANTE CACTUS", "RESTAURANTE DI LUCCA", "RESTAURANTE EL TAMBO", "RESTAURANTE HARRY SASS",
        "PARMESSANO REST DELICA", "DELIHOUSE", "NEXTFOOD COLOMBIA SAS",
        "OLIVIA SALITRE", "SEMOLINA", "SEMOLINA CHIA", "Semolina Chia",
        "BROT APICE", "BUKE ARTESANOS DEL PAN", "LOS HORNITOS PASTEL PA", "HORNITOS AMERICAS",
        "EL HORNO DE MIKAELA", "PASTELITOSS",
        "GODO BURGER", "VOODOO", "NECTARIA", "PERCIMÓN BOGOTA 93", "PERCIMÓN TESORO",
        "El Maná Coffee and Brunch", "ROSES CAFE BAR RESTAUR", "HISTORIA DE AMOR",
        "COTIZA LONGANIZA BOGOT", "SALCHICHAS ALEMANAS", "PUEBLITO BOYACENSE P",
        "RIBBERA", "CRECIMIENTO GASTRONO",
        "BON BONITE ANDINO", "LES AMIS BIZCOCHERIA C", "YANUBA CALLE 122",
        "HELADERIA HEC", "BERRY LAB",
        "AMMAZZA AMSTERDAM", "AREA FOUR RESTAURANT", "BLACK BEAR RESTAURANT", "FORT NASSAU REST.",
        "SALONIKI - HARVARD S",
        # Cafés
        "JUAN VALDEZ", "JUAN VALDEZ WORLD TRAD", "Juan Valdez Gran Estación", "JV COFFEE CURACAO",
        "TJV BARRA INST WEWORK", "TJV BARRA INST WEWOR",
        "CAFE PERGAMINO", "CAFE QUINDIO CC SANTAFE", "CAFE ZEPPELIN 3", "CAFEDIFIRE",
        "CAFFE ITALIANO LAVAZ", "COLO COFFEE USAQUEN", "FILANDIA COFFEE",
        "STARBUCKS FONTANAR", "STARBUCKS MALLPLAZA NQ", "Starbucks Fontanar",
        "TOSTAO CAFE Y PAN CE", "VARIETALE DORADO", "EL ALTILLO CAFE STA BA",
        "TIENDA LIBERTARIO COFF",
        # Supermercados y tiendas de alimentos
        "CARULLA CALLE 140", "EXITO FONTANAR CHIA", "EXITO WOW COUNTRY", "EXITO WOW UNIBOGOTA",
        "TH EXITOS SAS", "TH UNICENTRO BOGOTA", "EYD CAFES SAS EXITO",
        "JERONIMO MARTINS COLOM (ARA)", "TIENDA D1 ECOTEK 99",
        "ALKOSTO AVX 68", "GARDEN MARKET SAS", "CABAÑA ALPINA SOPO",
        "EL FRIJOL IN S A S", "ALIMENTOS RIE",
        # Bold - Restaurantes y comida
        "BOLD*AWALA BURGERS", "BOLD*BUENAZO EL POLL", "BOLD*GANSO Y CASTOR",
        "BOLD*LOMA", "BOLD*EL JARDIN DE LU", "BOLD*MIS RAICES", "BOLD*Avena cubana",
        "BOLD*EL MISTICO", "BOLD*ANATOLIA CONCEP", "BOLD*MERCARI", "BOLD*ARISTAS", "BOLD*CONCEPTO D",
        
        # New 2026 Analysis
        "NOVAVENTA", "COMPRA EN  NOVAVENTA", "NOVAVENTA BOG",
        "COMPRA EN  STARBUCKS", "JV BOGOTAS", "COMPRA EN  JV BOGOTAS",
        "COMPRA EN  EYD CAFES", "COMPRA EN  TH EXITOS",
    ],

    # ===========================================
    # TRANSPORTE
    # ===========================================
    "Transporte": [
        # Uber/Didi
        "UBER *TRIP", "UBER RIDES", "UBER TRIP", "Uber", "Uber Rides", "Uber viaje",
        "DIDI", "DIDI RIDES", "DL*DIDI RIDES CO", "DLO*DIDI", "Didi", "Didi Rides",
        # Gasolina
        "EDS CLL 80", "EDS CRUZ ROJA FR", "EDS CRUZ ROJA FR (Gasolina)", "EDS Cruz Roja",
        "EDS NUEVA AVENIDA", "EDS PONTEVEDRA FR", "EDS SOSTENIBLES MELGAR",
        "ESTACION DE SERVICIO T",
        # Parqueaderos
        "CENTRAL PARKING", "CITY PARKING", "PARKING INTERNATIONA", "Parking International",
        "PARQUEADERO 92", "Parqueadero 92", "ESTACIONAMIENTO CARU", "Estacionamiento Caru",
        "FONTANAR CCO/PARQUEA", "FONTANAR CCO/PARQUEADE", "FONTANAR CCO/PARQUEADERO", "Fontanar CCO Parqueadero",
        "IPARK COUNTRY", "CC PALATINO", "CC SALITRE PLAZA",
        # Bicicletas compartidas
        "TEMBICI", "Tembici", "Tembici (bicicletas)", "PYU TEMBICI", "PYU*TEMBICI", "PAYU*TEMBICI", "PayU Tembici",
        # Alquiler de autos
        "DOLLAR RAC", "NATIONAL CAR RENTAL", "RENTING COLOMBIA",
        # Aerolíneas y viajes
        "AVIANCA", "AVIANCA LIFEMILES CUR", "MPOS-AVIANCA", "SUSCRIPCION LIFEMILES",
        "LATAM AIRLINES", "AEROVIÁS DEL CONTINENT",
        "DESPEGAR COLOMBIA",
        # Transporte público
        "MBTA", "MBTA HARVARD", "MBTA Harvard", "MBTA WELLINGTON",
        "FLYPASS", "PAGO ELECTRONICO FLYPASS",
    ],

    # ===========================================
    # SERVICIOS (Telecomunicaciones, Servicios públicos)
    # ===========================================
    "Servicios": [
        # Telecomunicaciones
        "COMCEL", "COMCEL (Claro)", "COMCEL - Boton Bancolombia",
        "COMUNICACION CELULAR COMCEL S", "COMUNICACION CELULAR SA COMCEL",
        "UNE EPM Telecomunicaciones", "UNE EPM Telecomunicaciones SA",
        "EMPRESA DE TELECOMUNICACIONES", "Portal Internet",
        # Servicios públicos
        "ENEL COLOMBIA SA ESP",
        "EPM SERVICIOS P", "EPM SERVICIOS P - Factura", "EPM SERVICIOS P - Factura pendiente", "Factura EPM SERVICIOS P",
        "Empresa de Acueducto y Alcant", "Empresa de Acueducto y Alcantarillado",
        # Administración
        "CONJ HACIENDA SANTA", "CONJ HACIENDA SANTA BA", "TORRE AMADEUS PROPIE",
        "PATRIMO AUTONMOS EST", "PATRIMONIOS AUTONOMOS FIDUCIA",
    ],

    # ===========================================
    # SUSCRIPCIONES (Streaming, Software, Apps)
    # ===========================================
    "Suscripciones": [
        # Streaming
        "SPOTIFY", "Spotify",
        "PRIME VIDEO", "PRIME VIDEO DL",
        "AMAZON PRIME", "AMAZON PRIME PMTS",
        "GOOGLE PLAY YOUTUBE",
        # Software y apps
        "MICROSOFT", "MICROSOFT*DL", "DLO*MICROSOFT", "PAYU*MICROSOFT", "Microsfot",
        "GOOGLE ONE", "DLO*GOOGLE GOOGLE ONE", "Google One",
        "GOOGLE NORDVPN",
        "WONDERSHARE.COM",
        # Hosting
        "BANAHOSTING",
        "CLAUDE.AI", "CLAUDEAI", "ANTHROPIC",
    ],

    # ===========================================
    # COMPRAS (Retail, Ropa, Electrónica)
    # ===========================================
    "Compras": [
        # Marketplaces online
        "AMAZON COM", "AMAZON MKTPLACE", "AMAZON.COM", "Amazon",
        "MERCADO PAGO", "MERCADO PAGO LIMITADA", "MERCADOPAGO", "MERCADOPAGO COLOMBIA", "MERCADOPAGO COLOMBIA L", "Mercado Pago",
        "MERCADO PAGO*MERCADOLI",
        # Ropa y calzado
        "FALABELLA", "FALABELLA TDA POR DEP",
        "BOSI BAMBINO COLINA", "MERCADO PAGO*BOSI",
        "TIENDAS PUNTO GEF UNIC", "PYU*ADIDAS",
        "LOVISA SANTAFE MEDEL",
        "MERCADO PAGO*PANDORA", "MERCADO PAGO*CUEROSVEL",
        # Hogar
        "HOMECENTER", "HOMECENTER CEDRITOS", "HOMECENTER MEDELLIN", "HOMECENTER VTAS A DIST", "Homecenter", "Homecenter Mallplaza",
        "JV BOGOTA 4 HOMECENTER",
        "SODIMAC COLOMBIA SA",
        "IKEA NQS",
        "GLOBAL DECORATION SAS", "LACORPACK",
        # Electrónica
        "K Tronix Salitre Plaza", "KTRONIX CHIA", "BEST BUY",
        "ENSAMBLADORA UNIVERS",
        # Deporte
        "DECATHLON FONTANAR", "DECATHLON PLAZA CLAR", "Decathlon Atlantis",
        "SWING PADEL CLUB COL",
        # Juguetes y hobbies
        "PEPE GANGA FONTANAR", "MATERILE JUGUETES LIBR",
        "BOLD*ZARPO COMICS", "BOLD*Hobbies Cali",
        # Tiendas varias
        "MINISO CALLE 100", "Miniso Calle 100",
        "CACHIVACHES STA ANA", "CACHIVACHES USA",
        "NOVAVENTA BOG", "NOVAVENTA BOG CODIGO", "Novaventa BOG",
        "IN BOND GEMA N 3",
        "COSETTE FONTANAR",
        # Catálogo venta directa
        "Faber Castell (BOLD)",
        "COMPRA EN  FONTANAR", "COMPRA EN  FONTANAR C",
        "INVERSIONECREDITO LAS MALLAS", "INVERSIONES LAS MALLAS",
        "DECATHLON", "COMPRA EN  DECATHLON",
    ],

    # ===========================================
    # SALUD (Farmacias, Médicos, Seguros)
    # ===========================================
    "Salud": [
        # Farmacias
        "CRUZ VERDE BELMIRA", "CRUZ VERDE UNICENTRO", "Cruz Verde Fontanar", "MERCADO PAGO*CRUZVERDE",
        "DROGAS LA REBAJA", "DROGUERIA EL DORADO", "DROGUERIA FONTANAR", "DROGUERIA SALITRE P",
        "DROG PURA MUELLE INTER",
        "FARMATODO ANDINO", "FARMATODO BELLA SUIZ", "FARMATODO BELMIRA", "FARMATODO CLL 100",
        "FARMATODO CLL 127", "FARMATODO EL TESORO", "FARMATODO LOS PARRA",
        "LOCATEL CEDRITOS",
        # Consultas médicas
        "BOLD*CONSULTORII ODO",
        "COLCAN", "COMPANIA DE MEDICINA P",
        "DERMA SUPPORT STORE",
        # Ópticas y otros
        "TIENDA DIETETICA",
    ],

    # ===========================================
    # ENTRETENIMIENTO (Cine, Eventos, Viajes)
    # ===========================================
    "Entretenimiento": [
        # Cine
        "CINE COLOMBIA", "CINE COLOMBIA S.A", "CINE COLOMBIA S.A.",
        "LUMINA MULTIPLEX", "LUMINA ROOFTOP",
        # Eventos y tickets
        "TICKET COLOMBIA", "MERCADO PAGO*FTEATRONA",
        "CORP DE FERIAS Y EXP",
        # Parques y atracciones
        "FUNDACION PARQUE JAIME",
        # Bares
        "VINÓS Y VINILOS ROOFTO", "CLUB HOUSE 109",
        # Hoteles y hospedaje
        "AIRBNB", "AIRALO",
        "BOOKING COLONIAL",
        "HOTEL LA FONTANA", "HOTEL LAS COLINAS DORA",
        "COURTYARD BY MARRIOTT",
    ],

    # ===========================================
    # EDUCACIÓN Y MEMBRESÍAS
    # ===========================================
    "Educación": [
        "BIBLIOTECA LA",
        "UNIANDINOSE",
        "CCO Y DE NEGOCIOS AN", "CCO Y DE NEGOCIOS ANDI", "CCo y de Negocios ANDI",
        "CENTRO COMERCIAL Y D", "CIUDADELA COMERCIAL", "CIUDADELA COMERCIAL UN",
    ],

    # ===========================================
    # BELLEZA Y CUIDADO PERSONAL
    # ===========================================
    "Belleza": [
        "SUPER NAILS FONTANAR",
        "ENTRELAZOS AEROPUERTO",
        "LA BOUTIQUE DE LAS CAR", "La Boutique de las Car",
    ],

    # ===========================================
    # MASCOTAS
    # ===========================================
    "Mascotas": [
        "COLSUBSIDIO COLONIAL", "COLSUB TIENDA DIVERSIO",
    ],

    # ===========================================
    # FINANZAS (Bancos, Impuestos, Seguros)
    # ===========================================
    "Finanzas": [
        "BANCO DE CREDITO DE COLOMBIA",
        "Banco Davivienda S.A.", "Banco Davivienda S.A. Zona P",
        "NU Colombia (tarjeta de crédito)", "NU Colombia Compania de Finan", "NU Compania de Financiamiento",
        "ALIANZA FIDUCIARIA S.A. FIDEI", "FONDO LEGADOS SAS",
        "DIAN - PSE", "PSE", "PSE Banco", "PSE Comercio", "Pago PSE",
        "TECNIPAGOS S A", "PAYMENTS WAY",
        "FUNDACION CORAZON VE",
        "CAJA COLOMBIANA DE SUBSIDIO F",
        # Impuestos y Financieros 2026
        "IMPTO GOBIERNO 4X1000", "ABONO INTERESES AHORROS", "PAGO DE NOMI MIBANCO SA",
        "CUOTA DE MANEJO",
    ],

    # ===========================================
    # PAGOS A PERSONAS / TRANSFERENCIAS
    # ===========================================
    "Transferencias": [
        # These are usually transfers to people
        "A JAIRO HAMON", "NANCY JADILLE HOLGUI", "Fernandez Fernandez FO",
        "ANGELA MARIA PANIAGUA RUIZ", "Angela Maria Paniagua Ruiz",
        "Luis Antonio Amaya Salinas",
        # 2026 Transfers
        "TRANSF A ANGELA MARIA", "TRANSF A",
    ],

    # ===========================================
    # OFICINA Y PAPELERÍA
    # ===========================================
    "Oficina": [
        "COMERCIAL PAPELERA S", "COMERCERPAL",
    ],

    # ===========================================
    # PARQUEADERO (específico - ya en Transporte)
    # ===========================================
    "Parqueadero": [
        "BOLD*ALPARKE",
    ],

    # ===========================================
    # DEPORTES Y RECREACIÓN
    # ===========================================
    "Deportes": [
        "CLUB CAMP BELLAVISTA C",
    ],

    # ===========================================
    # OTROS CONOCIDOS
    # ===========================================
    "Otros_Conocidos": [
        # QR payments - generic
        "Pago QR llave 0040542078", "Pago por código QR",
        # Marketplace payments
        "PAYU TIENDA NRMA", "MERCADO PAGO*HMINGENIE", "MERCADO PAGO*IDMC", "MERCADO PAGO*CONTINENT",
        "Mercado Pago Salitrema",
        # Various
        "OXXO TORRE CIEN",
        "ARCHI  S CTRO CHIA",
        "BACU UNICENTRO",
        "UNA", "JULIA", "AMARTI", "YARDINS CHICO", "CARRO", "MULERA CALLE 97",
        "ALTAS VISTAS SAS", "VISIONARY SOCIETY SAS", "MORRIS OMEARA INVERS",
        "GLOBAL COLOMBIA 81 SA", "EBF INVERSIONES S A", "INVERSIONES BEIKED S", "INVERSIONES DUQUE TO",
        "JELM INV TAMBOR TENJ",
        "DISTRIHOGAR BOGOTA UNI", "REDH ABADIA",
        "GRUPO TCW", "CMK TESORO", "KKO PALATINO", "KKO Unicentro Bogotá",
        "LC MALL PLAZA NQS", "PARQUE COMERCIAL EL TE",
        "SIMCARD INTERNACIONAL", "AGUA DE AFLUENTES SAS",
        "THE O HARBOURFRONT",
    ],
}

# Reverse mapping: merchant -> category
def get_category_for_merchant(merchant_name):
    """Returns the category for a given merchant name."""
    if not merchant_name:
        return "Otros"
    
    merchant_upper = merchant_name.upper().strip()
    merchant_clean = merchant_name.strip()
    
    for category, merchants in CATEGORY_MAPPING.items():
        for m in merchants:
            if m.upper() in merchant_upper or merchant_upper in m.upper():
                return category
    
    # Fallback patterns
    patterns = {
        "Alimentación": ["RESTAURANTE", "CAFÉ", "COFFEE", "PIZZA", "BURGER", "FOOD", "GRILL", "PANADERIA", "PASTEL"],
        "Transporte": ["EDS ", "PARKING", "PARQUEADERO", "UBER", "DIDI", "AVIANCA", "AIRLINE"],
        "Salud": ["FARMACIA", "DROGUERIA", "CRUZ VERDE", "FARMATODO", "MEDIC", "DROG"],
        "Compras": ["HOMECENTER", "FALABELLA", "ALKOSTO", "AMAZON", "MERCADOLIBRE"],
        "Servicios": ["EPM", "ENEL", "COMCEL", "CLARO", "UNE", "TELECOMUNICA"],
        "Suscripciones": ["SPOTIFY", "NETFLIX", "PRIME", "MICROSOFT", "GOOGLE"],
        "Entretenimiento": ["CINE", "TEATRO", "HOTEL", "AIRBNB"],
    }
    
    for category, keywords in patterns.items():
        for kw in keywords:
            if kw in merchant_upper:
                return category
    
    return "Otros"


if __name__ == "__main__":
    # Test
    test_merchants = [
        "CREPES Y WAFFLES",
        "UBER TRIP",
        "SPOTIFY",
        "HOMECENTER CEDRITOS",
        "EPM SERVICIOS P",
        "UNKNOWN MERCHANT",
    ]
    
    for m in test_merchants:
        print(f"{m} -> {get_category_for_merchant(m)}")
