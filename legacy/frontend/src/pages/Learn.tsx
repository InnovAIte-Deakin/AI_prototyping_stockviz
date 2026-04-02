import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play, 
  Target, 
  Award, 
  Clock, 
  Users, 
  TrendingUp,
  BarChart3,
  Calculator,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Download
} from 'lucide-react';

const Learn = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const courses = [
    {
      id: 'basics',
      title: 'Stock Market Basics',
      description: 'Learn the fundamentals of stock market investing',
      duration: '2 hours',
      difficulty: 'Beginner',
      progress: 0,
      lessons: 8,
      icon: BookOpen,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'technical',
      title: 'Technical Analysis',
      description: 'Master chart patterns, indicators, and technical tools',
      duration: '4 hours',
      difficulty: 'Intermediate',
      progress: 25,
      lessons: 12,
      icon: BarChart3,
      color: 'from-green-500 to-emerald-400'
    },
    {
      id: 'fundamental',
      title: 'Fundamental Analysis',
      description: 'Analyze company financials and valuation metrics',
      duration: '3 hours',
      difficulty: 'Intermediate',
      progress: 0,
      lessons: 10,
      icon: Calculator,
      color: 'from-orange-500 to-yellow-400'
    },
    {
      id: 'advanced',
      title: 'Advanced Strategies',
      description: 'Options trading, portfolio management, and risk control',
      duration: '6 hours',
      difficulty: 'Advanced',
      progress: 0,
      lessons: 15,
      icon: TrendingUp,
      color: 'from-red-500 to-pink-400'
    }
  ];

  const lessons = [
    {
      id: '1',
      title: 'What is the Stock Market?',
      duration: '15 min',
      type: 'video',
      completed: false
    },
    {
      id: '2',
      title: 'How to Read Stock Quotes',
      duration: '20 min',
      type: 'interactive',
      completed: false
    },
    {
      id: '3',
      title: 'Understanding Market Orders',
      duration: '25 min',
      type: 'video',
      completed: false
    },
    {
      id: '4',
      title: 'Risk vs Return',
      duration: '18 min',
      type: 'article',
      completed: false
    }
  ];

  const achievements = [
    { title: 'First Course Completed', icon: Award, earned: true },
    { title: 'Technical Analysis Expert', icon: BarChart3, earned: false },
    { title: 'Portfolio Builder', icon: Target, earned: false },
    { title: 'Risk Manager', icon: Lightbulb, earned: true }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-orange-100 text-orange-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              StockViz Learning Center
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Master the art of investing with our comprehensive courses, interactive lessons, and practical tools. 
              From beginner basics to advanced strategies.
            </p>
          </div>
        </div>
      </section>

      {/* Learning Stats */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Courses Available</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">2,543</p>
                <p className="text-sm text-muted-foreground">Active Learners</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Hours of Content</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Certifications</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="progress">My Progress</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Available Courses</h2>
                <p className="text-muted-foreground">Choose from our comprehensive library of investment courses</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const Icon = course.icon;
                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r ${course.color} rounded-xl`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <Badge className={getDifficultyColor(course.difficulty)}>
                            {course.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.lessons} lessons</span>
                          </div>
                        </div>
                        
                        {course.progress > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <Button className="w-full" onClick={() => setSelectedCourse(course.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          {course.progress > 0 ? 'Continue' : 'Start Course'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">My Learning Progress</h2>
                <p className="text-muted-foreground">Track your learning journey and completed lessons</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Course */}
                <Card>
                  <CardHeader>
                    <CardTitle>Currently Learning</CardTitle>
                    <CardDescription>Technical Analysis Course</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>25%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Recent Lessons</h4>
                      {lessons.slice(0, 3).map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className={`h-4 w-4 ${lesson.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="text-sm font-medium">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {lesson.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">3</p>
                        <p className="text-sm text-muted-foreground">Courses Started</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">24</p>
                        <p className="text-sm text-muted-foreground">Lessons Completed</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">12h</p>
                        <p className="text-sm text-muted-foreground">Time Invested</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">89%</p>
                        <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="mt-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Achievements & Badges</h2>
                <p className="text-muted-foreground">Unlock achievements as you progress through your learning journey</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <Card key={index} className={`text-center transition-all duration-300 ${
                      achievement.earned 
                        ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20' 
                        : 'opacity-60 grayscale'
                    }`}>
                      <CardContent className="p-6">
                        <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full ${
                          achievement.earned 
                            ? 'bg-gradient-to-br from-primary to-accent' 
                            : 'bg-muted'
                        }`}>
                          <Icon className={`h-8 w-8 ${achievement.earned ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <h3 className="font-semibold mb-2">{achievement.title}</h3>
                        {achievement.earned && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Earned
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of successful investors who have mastered the markets through our comprehensive courses.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg">
              <Play className="mr-2 h-5 w-5" />
              Start Your First Course
            </Button>
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download Study Guide
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Learn;
