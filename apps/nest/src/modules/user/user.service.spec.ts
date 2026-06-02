import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

describe('UserService', () => {
  let userService: UserService
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById'>>

  beforeEach(async () => {
    userRepository = {
      findById: jest.fn(),
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
      ],
    }).compile()

    userService = moduleRef.get(UserService)
  })

  it('returns a user without password', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061',
      nickname: 'leo',
      userAccount: 'leo',
      avatar: null,
      gender: null,
      userPassword: 'hashed-password',
      phone: null,
      email: 'leo@example.com',
      userStatus: 0,
      deleted: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    const user = await userService.getUserById('d58528ed-16b3-11f1-86a0-3c9c0f8ef061')

    expect(user).toMatchObject({
      id: 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061',
      userAccount: 'leo',
      email: 'leo@example.com',
    })
    expect(user).not.toHaveProperty('userPassword')
  })

  it('throws NotFoundException when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null)

    await expect(userService.getUserById('missing')).rejects.toBeInstanceOf(NotFoundException)
  })
})
