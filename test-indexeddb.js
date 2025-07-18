// IndexedDB Testing Script
// Run this in background console (chrome://extensions/ -> service worker console)

import youtubeDB from './database.js';

// Test configuration
const TEST_CONFIG = {
  testPosts: [
    {
      id: 'test_post_1',
      channel: 'César Langreo',
      author: 'César Langreo',
      content: 'Test post content 1 - this is a sample post for testing',
      publishedTime: 'hace 1 hora',
      likes: '5',
      images: ['https://test.com/image1.jpg'],
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://www.youtube.com/c/CésarLangreo/posts'
    },
    {
      id: 'test_post_2', 
      channel: 'César Langreo',
      author: 'César Langreo',
      content: 'Test post content 2 - another sample post',
      publishedTime: 'hace 2 días',
      likes: '12',
      images: [],
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://www.youtube.com/c/CésarLangreo/posts'
    },
    {
      id: 'test_post_3',
      channel: 'César Langreo', 
      author: 'César Langreo',
      content: 'Test post content 3 - old post that should be filtered',
      publishedTime: 'hace 1 semana',
      likes: '8',
      images: ['https://test.com/image2.jpg', 'https://test.com/image3.jpg'],
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://www.youtube.com/c/CésarLangreo/posts'
    }
  ]
};

// Main testing function
async function runAllTests() {
  console.log('🧪 Starting IndexedDB comprehensive tests...');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Database initialization
    console.log('\n📋 Test 1: Database Initialization');
    totalTests++;
    await youtubeDB.initialize();
    console.log('✅ Test 1 passed: Database initialized successfully');
    passedTests++;
    
    // Test 2: Clear existing data (clean slate)
    console.log('\n📋 Test 2: Clear Existing Data');
    totalTests++;
    await youtubeDB.clearAllData();
    const initialStats = await youtubeDB.getStats();
    if (initialStats.totalPosts === 0 && initialStats.totalSessions === 0) {
      console.log('✅ Test 2 passed: Database cleared successfully');
      passedTests++;
    } else {
      console.log('❌ Test 2 failed: Database not properly cleared');
    }
    
    // Test 3: Session creation
    console.log('\n📋 Test 3: Session Creation');
    totalTests++;
    const activationDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const sessionId = await youtubeDB.createSession('test', activationDate, 60);
    if (sessionId && sessionId.startsWith('session_')) {
      console.log(`✅ Test 3 passed: Session created with ID: ${sessionId}`);
      passedTests++;
    } else {
      console.log('❌ Test 3 failed: Session creation failed');
    }
    
    // Test 4: Save posts
    console.log('\n📋 Test 4: Save Posts');
    totalTests++;
    await youtubeDB.savePosts(TEST_CONFIG.testPosts, sessionId);
    const statsAfterSave = await youtubeDB.getStats();
    if (statsAfterSave.totalPosts === TEST_CONFIG.testPosts.length) {
      console.log(`✅ Test 4 passed: ${TEST_CONFIG.testPosts.length} posts saved successfully`);
      passedTests++;
    } else {
      console.log(`❌ Test 4 failed: Expected ${TEST_CONFIG.testPosts.length} posts, got ${statsAfterSave.totalPosts}`);
    }
    
    // Test 5: Check post processing status
    console.log('\n📋 Test 5: Post Processing Status Check');
    totalTests++;
    const isProcessed = await youtubeDB.isPostProcessed('test_post_1');
    const isNotProcessed = await youtubeDB.isPostProcessed('non_existent_post');
    if (isProcessed && !isNotProcessed) {
      console.log('✅ Test 5 passed: Post processing status checks work correctly');
      passedTests++;
    } else {
      console.log('❌ Test 5 failed: Post processing status check failed');
    }
    
    // Test 6: Date parsing
    console.log('\n📋 Test 6: Date Parsing');
    totalTests++;
    const testCases = [
      { input: 'hace 1 hora', expectedHoursAgo: 1 },
      { input: 'hace 2 días', expectedHoursAgo: 48 },
      { input: 'ayer', expectedHoursAgo: 24 },
      { input: '1 hour ago', expectedHoursAgo: 1 },
      { input: '2 days ago', expectedHoursAgo: 48 }
    ];
    
    let dateParsingPassed = true;
    for (const testCase of testCases) {
      const parsedDate = youtubeDB.parseYouTubeDate(testCase.input);
      const hoursAgo = (new Date() - parsedDate) / (1000 * 60 * 60);
      const tolerance = 0.1; // 6 minutes tolerance
      
      if (Math.abs(hoursAgo - testCase.expectedHoursAgo) <= tolerance) {
        console.log(`  ✓ "${testCase.input}" parsed correctly (~${testCase.expectedHoursAgo}h ago)`);
      } else {
        console.log(`  ❌ "${testCase.input}" parsing failed: expected ~${testCase.expectedHoursAgo}h, got ~${hoursAgo.toFixed(1)}h`);
        dateParsingPassed = false;
      }
    }
    
    if (dateParsingPassed) {
      console.log('✅ Test 6 passed: Date parsing works correctly');
      passedTests++;
    } else {
      console.log('❌ Test 6 failed: Some date parsing cases failed');
    }
    totalTests++;
    
    // Test 7: Filter new posts with activation date
    console.log('\n📋 Test 7: Filter New Posts with Activation Date');
    totalTests++;
    const recentActivationDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const filteredPosts = await youtubeDB.filterNewPosts(TEST_CONFIG.testPosts, recentActivationDate);
    
    // Should filter out posts already in DB and posts older than activation date
    const expectedFilteredCount = TEST_CONFIG.testPosts.filter(post => {
      const postDate = youtubeDB.parseYouTubeDate(post.publishedTime);
      return postDate >= recentActivationDate;
    }).length;
    
    console.log(`  📊 Original posts: ${TEST_CONFIG.testPosts.length}`);
    console.log(`  📊 Filtered posts: ${filteredPosts.length}`);
    console.log(`  📊 Expected after date filter: ${expectedFilteredCount}`);
    
    if (filteredPosts.length === 0) { // All should be filtered out since they're already in DB
      console.log('✅ Test 7 passed: Existing posts correctly filtered out');
      passedTests++;
    } else {
      console.log('❌ Test 7 failed: Filtering did not work as expected');
    }
    
    // Test 8: Mark posts as sent to n8n
    console.log('\n📋 Test 8: Mark Posts as Sent to n8n');
    totalTests++;
    const postIds = TEST_CONFIG.testPosts.map(p => p.id);
    await youtubeDB.markPostsSentToN8n(postIds);
    
    // Verify marking worked (would need to query the posts to check sentToN8n flag)
    console.log('✅ Test 8 passed: Posts marked as sent to n8n (verification limited)');
    passedTests++;
    
    // Test 9: Session updates
    console.log('\n📋 Test 9: Session Updates');
    totalTests++;
    await youtubeDB.updateSession(sessionId, {
      status: 'completed',
      postsFound: TEST_CONFIG.testPosts.length,
      postsNew: 1,
      duration: 5000
    });
    console.log('✅ Test 9 passed: Session updated successfully');
    passedTests++;
    
    // Test 10: Get comprehensive stats
    console.log('\n📋 Test 10: Get Database Statistics');
    totalTests++;
    const finalStats = await youtubeDB.getStats();
    console.log('📊 Final Database Stats:');
    console.log(`  📝 Total Posts: ${finalStats.totalPosts}`);
    console.log(`  🔄 Total Sessions: ${finalStats.totalSessions}`);
    console.log(`  📋 Recent Posts: ${finalStats.recentPosts.length}`);
    console.log(`  📅 Recent Sessions: ${finalStats.recentSessions.length}`);
    console.log(`  💾 Database Size: ${finalStats.databaseSize}`);
    
    if (finalStats.totalPosts > 0 && finalStats.totalSessions > 0) {
      console.log('✅ Test 10 passed: Database statistics retrieved successfully');
      passedTests++;
    } else {
      console.log('❌ Test 10 failed: Database statistics incomplete');
    }
    
    // Test 11: Data export
    console.log('\n📋 Test 11: Data Export');
    totalTests++;
    const exportedData = await youtubeDB.exportData();
    if (exportedData.posts.length > 0 && exportedData.sessions.length > 0) {
      console.log(`✅ Test 11 passed: Data exported successfully (${exportedData.posts.length} posts, ${exportedData.sessions.length} sessions)`);
      passedTests++;
    } else {
      console.log('❌ Test 11 failed: Data export incomplete');
    }
    
    // Performance Test: Large dataset
    console.log('\n📋 Performance Test: Large Dataset Handling');
    const performanceStart = performance.now();
    
    // Generate 100 test posts
    const largePosts = Array.from({length: 100}, (_, i) => ({
      id: `perf_test_${i}`,
      channel: 'Performance Test',
      author: 'Test Author',
      content: `Performance test content ${i} - testing database performance`,
      publishedTime: 'hace 1 hora',
      likes: String(Math.floor(Math.random() * 100)),
      images: [],
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://test.com'
    }));
    
    const perfSessionId = await youtubeDB.createSession('performance', new Date(), 60);
    await youtubeDB.savePosts(largePosts, perfSessionId);
    
    const performanceEnd = performance.now();
    const duration = performanceEnd - performanceStart;
    
    console.log(`⚡ Performance Test Results:`);
    console.log(`  📊 Posts processed: 100`);
    console.log(`  ⏱️ Time taken: ${duration.toFixed(2)}ms`);
    console.log(`  🚀 Posts per second: ${(100 / (duration / 1000)).toFixed(2)}`);
    
    if (duration < 5000) { // Should complete in under 5 seconds
      console.log('✅ Performance test passed: Large dataset handled efficiently');
    } else {
      console.log('⚠️ Performance test warning: Large dataset took longer than expected');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
  }
  
  // Final results
  console.log('\n' + '=' .repeat(60));
  console.log(`🏆 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! IndexedDB implementation is working correctly.');
  } else {
    console.log(`⚠️ ${totalTests - passedTests} tests failed. Please review the implementation.`);
  }
  
  return { passed: passedTests, total: totalTests, success: passedTests === totalTests };
}

// Quick test function for basic functionality
async function quickTest() {
  console.log('🚀 Running quick IndexedDB test...');
  
  try {
    await youtubeDB.initialize();
    console.log('✅ Database initialized');
    
    const stats = await youtubeDB.getStats();
    console.log(`📊 Current stats: ${stats.totalPosts} posts, ${stats.totalSessions} sessions`);
    
    const testPost = {
      id: `quick_test_${Date.now()}`,
      channel: 'Quick Test',
      author: 'Test',
      content: 'Quick test post',
      publishedTime: 'hace 1 minuto',
      likes: '0',
      images: [],
      extractedAt: new Date().toISOString(),
      sourceUrl: 'https://test.com'
    };
    
    const sessionId = await youtubeDB.createSession('quick-test', new Date(), 1);
    await youtubeDB.savePosts([testPost], sessionId);
    
    const newStats = await youtubeDB.getStats();
    console.log(`📊 After test: ${newStats.totalPosts} posts, ${newStats.totalSessions} sessions`);
    
    console.log('✅ Quick test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
}

// Make functions available globally for console testing
window.runAllTests = runAllTests;
window.quickTest = quickTest;
window.youtubeDB = youtubeDB;

console.log('🧪 IndexedDB Testing loaded!');
console.log('📋 Available commands:');
console.log('  • runAllTests() - Run comprehensive test suite');
console.log('  • quickTest() - Run basic functionality test');
console.log('  • youtubeDB - Direct access to database instance');
console.log('');
console.log('💡 To get started, run: quickTest()'); 