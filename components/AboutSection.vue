<template>
  <section id="o-nama" class="relative py-24 bg-taxi-darker">
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23F7C600\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center mb-16">
        <span class="inline-block text-taxi-yellow font-semibold tracking-wider uppercase mb-4">O nama</span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Taxi Zagreb - Vaša sigurna<br>i <span class="gradient-text">pouzdana vožnja!</span>
        </h2>
        <p class="text-gray-400 max-w-2xl mx-auto text-lg">
          Dolazak na željenu destinaciju u Zagrebu nikad nije bio lakši i udobniji! Naša taxi usluga nudi
          izvanredno iskustvo vožnje koje uključuje beskompromisnu transparentnost, vrhunsku sigurnost i udobnost.
        </p>
      </div>

      <!-- Features grid -->
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Feature 1: Security -->
        <div class="scroll-animate group relative bg-taxi-gray/50 backdrop-blur-sm border border-taxi-light rounded-3xl p-8 hover:border-taxi-yellow/50 transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-taxi-yellow/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div class="relative">
            <div class="w-16 h-16 bg-taxi-yellow/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <IconShield class="w-8 h-8 text-taxi-yellow" />
            </div>

            <h3 class="text-2xl font-bold mb-4">Sigurnost garantirana</h3>
            <p class="text-gray-400 leading-relaxed">
              Koristeći najnoviju tehnologiju i inovativna rješenja, pružamo brzu i pouzdanu uslugu koja će vas
              uvjeriti da ste odabrali najbolje. U našim vozilima, koja su moderna, udobna i besprijekorno čista,
              svako putovanje postaje užitak.
            </p>
          </div>
        </div>

        <!-- Feature 2: Professional drivers -->
        <div class="scroll-animate group relative bg-taxi-gray/50 backdrop-blur-sm border border-taxi-light rounded-3xl p-8 hover:border-taxi-yellow/50 transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-taxi-yellow/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div class="relative">
            <div class="w-16 h-16 bg-taxi-yellow/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <IconUser class="w-8 h-8 text-taxi-yellow" />
            </div>

            <h3 class="text-2xl font-bold mb-4">Profesionalni vozači</h3>
            <p class="text-gray-400 leading-relaxed">
              Naši vozači uvijek su spremni pružiti vam najbolju uslugu. Bez obzira na to trebate li prijevoz
              do doma, hotela ili bilo koje druge lokacije u Zagrebu, stojimo vam na raspolaganju za komforno putovanje.
            </p>
          </div>
        </div>
      </div>

      <!-- Contact CTA -->
      <div class="text-center mt-16">
        <div class="inline-flex flex-col sm:flex-row items-center gap-4 bg-taxi-gray/30 border border-taxi-light rounded-2xl p-6">
          <span class="text-gray-400">Naručite taxi odmah:</span>
          <a
            href="https://wa.me/385957703853"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105"
          >
            <IconWhatsApp class="w-5 h-5" />
            +385 95 770 3853
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
