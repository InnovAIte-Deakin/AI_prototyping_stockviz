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
  ArrowRight
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
      color: 'from-blue-500 to-blue-600'
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
      color: 'from-green-500 to-green-600'
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
      color: 'from-yellow-500 to-yellow-600'
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
      color: 'from-purple-500 to-purple-600'
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
      title: 'Risk Management Basics',
      duration: '30 min',
      type: 'reading',
      completed: false
    }
  ];

  const achievements = [
    {
      id: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: CheckCircle,
      earned: false,
      points: 50
    },
    {
      id: 'week-streak',
      title: 'Learning Streak',
      description: 'Learn for 7 days in a row',
      icon: Target,
      earned: false,
      points: 200
    },
    {
      id: 'course-complete',
      title: 'Course Master',
      description: 'Complete your first course',
      icon: Award,
      earned: false,
      points: 500
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              Learning Center
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Master the art of stock analysis with our comprehensive courses, interactive lessons, and practical exercises.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">4</div>
                  <div className="text-xs text-muted-foreground">Courses</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-500">45</div>
                  <div className="text-xs text-muted-foreground">Lessons</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-500">15h</div>
                  <div className="text-xs text-muted-foreground">Content</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-500">3</div>
                  <div className="text-xs text-muted-foreground">Achievements</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Choose Your Learning Path</h2>
            <p className="text-muted-foreground">Start with the basics or jump into advanced topics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => {
              const Icon = course.icon;
              return (
                <Card key={course.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${course.color} group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Play className="h-4 w-4" />
                          <span>{course.lessons} lessons</span>
                        </div>
                      </div>
                      {course.progress > 0 && (
                        <span className="text-primary font-medium">{course.progress}% complete</span>
                      )}
                    </div>

                    {course.progress > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    )}

                    <Button className="w-full" variant={course.progress > 0 ? "default" : "outline"}>
                      {course.progress > 0 ? "Continue Learning" : "Start Course"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Lessons */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Recent Lessons</h2>
            <p className="text-muted-foreground">Continue where you left off</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        lesson.completed ? 'bg-green-100' : 'bg-muted'
                      }`}>
                        {lesson.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Play className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{lesson.duration}</span>
                          <Badge variant="outline" className="text-xs">
                            {lesson.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {lesson.completed ? "Review" : "Start"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Achievements</h2>
            <p className="text-muted-foreground">Track your learning progress and earn rewards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card key={achievement.id} className={`${
                  achievement.earned ? 'border-yellow-200 bg-yellow-50' : 'opacity-60'
                } transition-all duration-300`}>
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      achievement.earned ? 'bg-yellow-100' : 'bg-muted'
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        achievement.earned ? 'text-yellow-600' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                    <Badge variant={achievement.earned ? "default" : "secondary"}>
                      {achievement.points} points
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Learn;
