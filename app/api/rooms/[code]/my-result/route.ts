import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/roomStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const room = getRoom(params.code);
  if (!room) {
    return NextResponse.json(
      { error: 'ไม่พบห้องกิจกรรมนี้' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json(
      { error: 'Student ID is required' },
      { status: 400 }
    );
  }

  const student = room.students[studentId];
  if (!student) {
    return NextResponse.json(
      { error: 'ไม่พบข้อมูลนักเรียนคนนี้ในห้อง' },
      { status: 404 }
    );
  }

  // Calculate this student's rank among all students in room
  const sortedStudents = Object.values(room.students).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.completed !== b.completed) return a.completed ? -1 : 1;
    if (a.timeTakenSeconds && b.timeTakenSeconds) {
      return a.timeTakenSeconds - b.timeTakenSeconds;
    }
    return a.joinedAt - b.joinedAt;
  });

  const rank = sortedStudents.findIndex((s) => s.id === studentId) + 1;

  // STRICT PRIVACY: Return ONLY this student's own data (คะแนนใครคะแนนมัน)
  return NextResponse.json({
    success: true,
    result: {
      studentName: student.name,
      score: student.score,
      matchedPairsCount: student.matchedPairsCount,
      completed: student.completed,
      rank: rank > 0 ? rank : 1,
      totalPlayers: sortedStudents.length,
      categoryName: room.categoryName,
      roomCode: room.code,
    },
  });
}
