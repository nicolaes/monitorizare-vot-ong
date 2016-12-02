﻿using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using MonitorizareVot.Domain.Ong.Models;
using MonitorizareVot.Ong.Api.Extensions;
using MonitorizareVot.Ong.Api.ViewModels;
using System.Linq;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace MonitorizareVot.Ong.Api.Queries
{
    public class FormulareQueryHandler :
        IAsyncRequestHandler<IntrebariQuery, ApiResponse<List<SectiuneModel>>>
    {
        private readonly OngContext _context;
        private readonly IMapper _mapper;

        public FormulareQueryHandler(OngContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ApiResponse<List<SectiuneModel>>> Handle(IntrebariQuery message)
        {
            var intrebari = await _context.Intrebare
                .Include(i => i.IdSectiuneNavigation)
                .Include(i => i.RaspunsDisponibil)
                    .ThenInclude(i => i.IdOptiuneNavigation)
                .Where(i => i.CodFormular == message.CodFormular)
                .ToListAsync();

            var sectiuni = intrebari.Select(a => new { a.IdSectiune, a.IdSectiuneNavigation.CodSectiune, a.IdSectiuneNavigation.Descriere }).Distinct();

            var result = sectiuni.Select(i => new SectiuneModel
            {
                CodSectiune = i.CodSectiune,
                Descriere = i.Descriere,
                Intrebari = intrebari.Where(a => a.IdSectiune == i.IdSectiune).Select(a => _mapper.Map<IntrebareModel>(a)).ToList()
            }).ToList();

            return new ApiResponse<List<SectiuneModel>> { Data = result };
        }
    }
}