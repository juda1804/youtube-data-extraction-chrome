📋 Ver IDs Guardados

  1. Listar Todos los IDs

  En el console del background script (chrome://extensions/ → Service Worker):

  // Ver todos los IDs de posts
  youtubeDB.exportData().then(data => {
    const postIds = data.posts.map(p => p.id);
    console.log('🆔 IDs de Posts guardados:');
    postIds.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    console.log(`\n📊 Total: ${postIds.length} posts`);
  });

  2. Ver IDs con Fechas

  // Ver IDs con sus fechas de creación
  youtubeDB.exportData().then(data => {
    console.log('🗓️ Posts con fechas:');
    data.posts
      .sort((a, b) => new Date(b.extractedAt) - new Date(a.extractedAt))
      .forEach((post, index) => {
        console.log(`${index + 1}. ${post.id}`);
        console.log(`   📅 Extraído: ${post.extractedAt}`);
        console.log(`   👤 Autor: ${post.author}`);
        console.log(`   ⏰ Publicado: ${post.publishedTime}`);
        console.log('');
      });
  });

  📝 Ver Mensajes/Posts Completos

  1. Ver Todos los Posts con Contenido

  // Ver posts completos con contenido
  youtubeDB.exportData().then(data => {
    console.log('📰 Posts completos guardados:');
    data.posts.forEach((post, index) => {
      console.log(`\n📋 POST ${index + 1}:`);
      console.log(`🆔 ID: ${post.id}`);
      console.log(`👤 Autor: ${post.author}`);
      console.log(`📅 Publicado: ${post.publishedTime}`);
      console.log(`🕐 Extraído: ${post.extractedAt}`);
      console.log(`💬 Contenido: ${post.content.substring(0, 
  200)}${post.content.length > 200 ? '...' : ''}`);
      if (post.likes) console.log(`👍 Likes: ${post.likes}`);
      if (post.images?.length > 0) console.log(`🖼️ Imágenes: 
  ${post.images.length}`);
      console.log('─'.repeat(50));
    });
  });

  2. Buscar Posts por Contenido Específico

  // Buscar posts que contengan texto específico
  youtubeDB.exportData().then(data => {
    const searchTerm = 'ETH'; // Cambia por el texto que buscas
    const matches = data.posts.filter(post =>
      post.content.toUpperCase().includes(searchTerm.toUpperCase())
    );

    console.log(`🔍 Posts que contienen "${searchTerm}":`);
    matches.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.id}`);
      console.log(`📅 ${post.publishedTime}`);
      console.log(`💬 ${post.content.substring(0, 300)}...`);
    });
    console.log(`\n📊 Encontrados: ${matches.length} de ${data.posts.length} 
  total`);
  });

  3. Ver Post Específico por ID

  // Ver un post específico
  async function verPost(postId) {
    const data = await youtubeDB.exportData();
    const post = data.posts.find(p => p.id === postId);

    if (post) {
      console.log('📋 Post encontrado:');
      console.log('🆔 ID:', post.id);
      console.log('👤 Autor:', post.author);
      console.log('📅 Publicado:', post.publishedTime);
      console.log('🕐 Extraído:', post.extractedAt);
      console.log('💬 Contenido completo:');
      console.log(post.content);
      if (post.images?.length > 0) {
        console.log('🖼️ Imágenes:');
        post.images.forEach((img, i) => console.log(`  ${i + 1}. ${img}`));
      }
    } else {
      console.log('❌ Post no encontrado:', postId);
    }
  }

  // Usar así:
  verPost('community_post_César Langreo_z296ti');

  📊 Ver Estadísticas Detalladas

  // Estadísticas completas
  youtubeDB.getStats().then(stats => {
    console.log('📊 ESTADÍSTICAS DE BASE DE DATOS:');
    console.log(`📝 Total Posts: ${stats.totalPosts}`);
    console.log(`🔄 Total Sessions: ${stats.totalSessions}`);
    console.log(`💾 Tamaño DB: ${stats.databaseSize}`);
    console.log(`📅 Posts Recientes: ${stats.recentPosts.length}`);
    console.log(`🕐 Sessions Recientes: ${stats.recentSessions.length}`);

    console.log('\n📋 Posts Recientes:');
    stats.recentPosts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.id} - ${post.author} 
  (${post.publishedTime})`);
    });
  });

  🕵️ Ver Duplicados

  // Detectar posts duplicados
  youtubeDB.exportData().then(data => {
    const idCounts = {};
    data.posts.forEach(post => {
      idCounts[post.id] = (idCounts[post.id] || 0) + 1;
    });

    const duplicates = Object.entries(idCounts).filter(([id, count]) => count >
  1);

    if (duplicates.length > 0) {
      console.log('🚨 IDs DUPLICADOS encontrados:');
      duplicates.forEach(([id, count]) => {
        console.log(`- ${id}: ${count} veces`);
      });
    } else {
      console.log('✅ No hay duplicados en la base de datos');
    }
  });

  📅 Ver Posts por Fecha

  // Ver posts agrupados por fecha
  youtubeDB.exportData().then(data => {
    const porFecha = {};

    data.posts.forEach(post => {
      const fecha = post.extractedAt.split('T')[0]; // Solo la fecha
      if (!porFecha[fecha]) porFecha[fecha] = [];
      porFecha[fecha].push(post);
    });

    console.log('📅 Posts por fecha:');
    Object.entries(porFecha)
      .sort()
      .forEach(([fecha, posts]) => {
        console.log(`\n📅 ${fecha}: ${posts.length} posts`);
        posts.forEach(post => {
          console.log(`  - ${post.id} (${post.publishedTime})`);
        });
      });
  });

  🎯 Comandos Rápidos para Copy-Paste

  // 1. Ver últimos 5 posts
  youtubeDB.exportData().then(d => console.log('Últimos 5:',
  d.posts.slice(-5).map(p => ({id: p.id, content: p.content.substring(0,100)}))))

  // 2. Contar posts por autor
  youtubeDB.exportData().then(d => console.log(d.posts.reduce((acc,p) =>
  {acc[p.author]=(acc[p.author]||0)+1; return acc}, {})))

  // 3. Ver todos los IDs
  youtubeDB.exportData().then(d => console.log('IDs:', d.posts.map(p => p.id)))

  // 4. Ver posts de hoy
  youtubeDB.exportData().then(d => console.log('Hoy:', d.posts.filter(p =>
  p.extractedAt.startsWith(new Date().toISOString().split('T')[0]))))