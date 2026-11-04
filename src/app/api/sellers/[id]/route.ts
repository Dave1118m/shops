import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, hashPassword } from "@/lib/auth";
import { validatePassword } from "@/lib/security";

/**
 * PATCH /api/sellers/[id] - Owner updates staff member status or resets password
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(authHeader.substring(7));
    if (!session || session.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only the shop owner can manage staff accounts." },
        { status: 403 }
      );
    }

    // Prevent Owner from disabling themselves
    if (session.id === id) {
      return NextResponse.json(
        { error: "You cannot disable or modify your own primary owner account through this endpoint." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    const body = await req.json();
    const updateData: { status?: string; passwordHash?: string } = {};

    // 1. Status Toggle (ACTIVE / DISABLED)
    if (body.status !== undefined) {
      if (body.status !== "ACTIVE" && body.status !== "DISABLED") {
        return NextResponse.json(
          { error: "Status must be either 'ACTIVE' or 'DISABLED'." },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // 2. Password Reset by Owner
    if (body.newPassword) {
      const passwordVal = validatePassword(body.newPassword);
      if (!passwordVal.valid) {
        return NextResponse.json({ error: passwordVal.error }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(body.newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "STAFF_UPDATED",
          entity: "User",
          entityId: id,
          details: JSON.stringify({
            updatedUsername: targetUser.username,
            statusChange: updateData.status,
            passwordReset: !!updateData.passwordHash,
            updatedBy: session.username,
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      staff: updatedUser,
    });
  } catch (error: any) {
    console.error("PATCH /api/sellers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member." },
      { status: 500 }
    );
  }
}
